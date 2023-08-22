/**
 * Utility to transform a StepsDefinition to a graphed dashboard
 */
import _ from "lodash";
import {Graph as GraphLib} from '@dagrejs/graphlib';

import {StepsDefinition} from "phd-assess-meta/types/dashboards";

/**
 * From a StepsDefinition for dashboard, set the parent-children relationship to represent the sequential path
 * of the activities and add edges between twins and activities at the same level
 */
export const convertDefinitionToGraph = (definition: StepsDefinition) => {
  const graph = new DashboardGraph();

  definition.forEach((step) => {
    graph.setNode(step.id, step);

    // set all parents of this node
    step.parents?.forEach(p => graph.setParentEdge(step.id, p))

    // set a link between node that have the same parents configuration, as a shortcut, to represent the same level
    // as siblings
    if (step.parents) {
      definition.filter(
        (cStep) =>
          cStep.id != step.id &&
          cStep.parents &&
          compareArraysValues(cStep.parents, step.parents!)
      ).forEach(
        (dStep) => graph.setSibling(step.id, dStep.id)
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
    super({ compound: false, directed: true, multigraph: false });
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

  if (!nodeParents) {
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

  if (!nodeChildren) {
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
