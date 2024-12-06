/**
 * Utility to transform a StepsDefinition to a graphed dashboard
 */
import _ from "lodash";
import {Graph as GraphLib} from '@dagrejs/graphlib';

import {Step, StepsDefinition} from "phd-assess-meta/types/dashboards";


// there is dashboardDefinition running in production with the typo on the word "Improvement"
// mistakes were made, better fix it inline now
export const fixStepKnownAsTypo = (step: Step) => {
  if (step.knownAs) {
    const updatedKnownAs = step.knownAs.map(value => {
      if (value === "Activity_Program_Director_Signs_Needs_Improvment_And_Disagree") {
        return "Activity_Program_Director_Signs_Needs_Improvement_And_Disagree";
      } else if (value === "Activity_Program_Director_Signs_Needs_Improvment_Or_Unsatisfactory_And_Agree") {
        return "Activity_Program_Director_Signs_Needs_Improvement_Or_Unsatisfactory_And_Agree";
      }
      return value;
    });

    return {
      ...step,
      knownAs: updatedKnownAs,
    };
  }

  return step;
}

/**
 * From a StepsDefinition for dashboard, set the parent-children relationship to represent the sequential path
 * of the activities and add edges between twins and activities at the same level.
 * All relationships are represented as Edges, only the order is using the parent-child-predecessor-successor feature
 * of the graph lib.
 */
export const convertDefinitionToGraph = (definition: StepsDefinition | undefined) => {
  const graph = new DashboardGraph();

  if (!definition) return

  definition = definition.map(step => fixStepKnownAsTypo(step));

  definition.forEach((step, index) => {
    graph.setNode(step.id, step);

    if (step.knownAs)
      // create a "virtual node" for the knownAs,
      // as it will be virtual siblings later
      step.knownAs.forEach( as => graph.setNode(as))

    // allow to get an order by using the parent-child graphlib relationship
    if (index > 0) graph.setParent(step.id, definition[index-1].id)

    // set all parents (as Edges) of this node
    step.parents?.forEach(p => graph.setParentEdge(step.id, p))

    // set a link between nodes, as sibling, for the one that have the same parents configuration.
    // They represent the same level.
    if (step.parents) {
      definition.filter(
        (cStep) =>
          cStep.id != step.id &&
          cStep.parents &&
          compareArraysValues(cStep.parents, step.parents!)
      ).forEach(
        dStep => graph.setSibling(step.id, dStep.id)
      )
    }
  })

  return graph;
}

type EdgeType = 'parent' | 'sibling'

/**
 * Extends @dagrejs/graphlib/Graph to set specific edges, like edgeType
 */
export class DashboardGraph extends GraphLib {
  constructor() {
    super({ compound: true, directed: true, multigraph: false });
  }

  /**
   *  Get nodes, respecting the parent-child hierarchy
   */
  nodesOrdered() {
    // find the first node
    let anyNode = this.nodes()[0]  // this should be the first alphabetically

    while(this.parent(anyNode)) {
      anyNode = this.parent(anyNode)!
    }

    const orderedNodes: string[] = [anyNode]
    let anyNodeChildren = this.children(anyNode)

    // build the children list
    while(anyNodeChildren && anyNodeChildren.length) {
      orderedNodes.push(anyNodeChildren[0])
      anyNodeChildren = this.children(anyNodeChildren[0])
    }

    return orderedNodes
  }

  setParentEdge(node: string, stepParentID: string): void  {
    this.setEdge(node, stepParentID, 'parent' as EdgeType)
  }

  /**
   * Get the direct parents in the tree
   * @param the step id starting point
   */
  getParents(stepId: string): string[] {
    const parents =
      this.outEdges(stepId)?.filter(e => this.edge(e) === 'parent' as EdgeType)?.map(e => e.w)
    return parents ?? []
  }

  /**
   * Get all parents in the tree
   * @param the step id starting point
   */
  getAllParents(stepId: string): string[] {
    return _.uniq(_getAllParents(stepId, this))
  }

  /**
   * Get the direct children in the tree
   * @param the step id starting point
   */
  getChildren(stepId: string): string[] {
    const children =
      this.inEdges(stepId)?.filter(e => this.edge(e) === 'parent' as EdgeType)?.map(e => e.v)
    return children ?? []
  }

  /**
   * Get all children in the tree
   * @param the step id starting point
   */
  getAllChildren(stepId: string): string[] {
    return _.uniq(_getAllChildren(stepId, this))
  }

  setSibling(step: string, sibling: string): void {
    this.setEdge(step, sibling, 'sibling' as EdgeType)
  }

  getSiblings(stepId: string): string[] {
    const siblings =
      this.inEdges(stepId)?.filter(e => this.edge(e) === 'sibling' as EdgeType)?.map(e => e.v)
    return siblings ?? []
  }
}

const _getAllParents = (stepId: string, stepDefinition: DashboardGraph): string[] =>  {
  const nodeParents = stepDefinition.getParents(stepId)
  const parents = []

  if (!Array.isArray(nodeParents) || nodeParents.length == 0) {
    return []
  }

  for (const parent of nodeParents) {
    parents.push(parent);
    parents.push(..._getAllParents(parent, stepDefinition));
  }

  return parents
}

const _getAllChildren = (stepId: string, stepDefinition: DashboardGraph): string[] =>  {
  const nodeChildren = stepDefinition.getChildren(stepId)
  const children = []

  if (!Array.isArray(nodeChildren) || nodeChildren.length == 0) {
    return []
  }

  for (const child of nodeChildren) {
    children.push(child);
    children.push(..._getAllChildren(child, stepDefinition));
  }

  return children
}

const compareArraysValues = (arr1: string[], arr2: string[]) => {
  if (arr1.length !== arr2.length) {
    return false;
  }

  const sortedArr1 = [...arr1].sort();
  const sortedArr2 = [...arr2].sort();

  return sortedArr1.every((value, index) => value === sortedArr2[index]);
};

/**
 * We prefer to show the dir before the codir. Until the bpmn is changed,
 * do it in the code
 */
export const inverseCoDirAndDirInDefinition = (definition: StepsDefinition | undefined): StepsDefinition | undefined => {
  if (!definition) return undefined

  const indexOfThesisCoDirector = definition.findIndex(
    activity => activity.id === 'Activity_Thesis_Co_Director_fills_annual_report'
  );
  const indexOfThesisDirector = definition.findIndex(
    activity => activity.id === 'Activity_Thesis_Director_fills_annual_report'
  );

  // only for old workflows
  if (indexOfThesisCoDirector == 1 && indexOfThesisDirector == 2) {
    const coDirItem = definition[indexOfThesisCoDirector]

    definition[indexOfThesisCoDirector] = definition[indexOfThesisDirector];
    definition.splice(
      indexOfThesisDirector,
      1,
      coDirItem
    );
  }

  return definition
}
