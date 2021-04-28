# FAQ

**Q: What is this all about ?**

**A:** This meteor/react app is, behind the scene,
only a [Zeebe worker](https://stage.docs.zeebe.io/basics/job-workers.html) with a speciality on forms rendering and submitting.

**Q: But why naming it PhDAssess then ?**

**A:** Because it has hardcoded references to a specific Zeebe workflow (aka [Diagram](https://stage.docs.zeebe.io/basics/workflows.html)),
the one that manages the PhD assess workflow.

**Q: Which type of tasks are you going to handle on this app ?**

**A:** At the moment, thinking of these processes:
- the form filling
- the signing of a state (certainly with a "is it valid ?" button)
- the notification (certainly an email sent)
