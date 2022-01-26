# FAQ

**Q: What is this all about ?**

**A:** This meteor/react app is, behind the scene,
only a [Zeebe worker](https://stage.docs.zeebe.io/basics/job-workers.html) with a speciality on forms rendering and submitting.

**Q: But why naming it PhDAssess then ?**

**A:** Because it has hardcoded references to a specific Zeebe workflow (aka [Diagram](https://stage.docs.zeebe.io/basics/workflows.html)),
the one that manages the PhD assess workflow.

**Q: Diagrams look powerful ! What language is being use for bpmn conditions ?**

**A:** Take a look at https://camunda.github.io/feel-scala/docs/reference/what-is-feel/

**Q: Is the task-workflow a revolution in the Zeebe landscape ?**

**A:** Not really, somehow they did the same as [an example](https://github.com/camunda-community-hub/zeebe-simple-tasklist)

**Q: Which type of tasks are you going to handle on this app ?**

**A:** At the time being, only the form filling ('fill_form')
But we may be thinking to add these processes:
- the signing of a state (certainly with a "is it valid ?" button)
- the notification (certainly an email sent) ('send_email')
- Pdf generation

**Q: Why disabled fields are not being stored ?**

**A:** Despite formio will send the disabled formfield,
we filter out them to keep clean workflow instance variables
