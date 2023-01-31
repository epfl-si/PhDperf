# CHANGELOG

*1.16.1* (2023-01-31)
- Fix not being able to sync removed tasks on the list

*1.16.1* (2023-01-30)
- Fix FormIO checkbox being invisible on safari

*1.16.0* (2022-12-14)
- Remove journal.lastSeen published value for admin and use the new attribute isObsolete

*1.15.0* (2022-12-12)
- Set sticky header on the dashboard

*1.14.0* (2022-12-09)
- Redo the form edition, giving a better flow when things go wrong

*1.13.0* (2022-11-21)
- Update to Meteor 2.8.1
- Change error message container when task is submitted while being edited, from a div to toast
- Remove assignee sciper info on dashboard when the task is waiting on the mentor, for some roles

*1.12.0* (2022-11-16)
- Add a way to see obsolete tasks on the admin list view
- Order dashboard by Doctoral school, then student's name
- Set link to people profile from the dashboard
- Show student'sciper on the dasboard
- Change participants visibility to all users on task list
- Change participants colors on task list
- Remove the "by" info on the task list
- Improve how the task is fetched from the server (from a subscribtion to a method)
- Adding admin info into the task edition view
- Filter submitted task and obsolete one from queries
- Monitor status of the task when editing it, as in some cases the task can be submitted by someone else

*1.11.0* (2022-11-02)
- Remove the "by" info on the task list
- Add the account React provider for components
- Fix checking for the right to start an instance without the doctoral list
- Fix students is unable to see the dashboard for his tasks
- Remove useless info from activityLogs on submit (self-cleaning)
- Fix showing the task before it was loaded

*1.10.0* (2022-10-21)
- Reduce bandwidth needed to show the dasboard and the tasks list
- Improve dashboard presentation
- Update meteor to 2.8

*1.9.1* (2022-10-12)
- Update libs, the deep way this time

*1.8.0* (2022-10-11)
- Improve right checking
- Remove having the list of users sent to admins
- Separate subscribers, one for tasks list and one for task edit
- Remove the troublesome usage of the task key value. Use _id instead
- Add more info on the dashboard, when hovering a step
- Update libs

*1.7.2* (2022-05-05)
- Fix task going into failing when Mongo is not accessible

*1.7.1* (2022-04-27)
- Fix participants not being updated when doing a manual start

*1.7.0* (2022-04-26)
- Update to accounts-tequila 0.6.0, as needed for Tequila 2.1
- Add PhD Student dashboard

*1.6.0* (2022-04-07)
- Fix participants not being updated after a form submission
- Update to Meteor 2.7.1

*1.5.0* (2022-03-16)
- Add prometheus

*1.4.0* (2022-03-14)
- Update to Zeebe Node 2.4.0

*1.3.13* (2022-03-11)
- Fix zeebe status being cumulative, getting out of control
- Fix BPMN being able to send the wrong PDF at some notifier steps

*1.3.12* (2022-03-10)
- Fix the GRPC limit on messages

*1.3.11* (2022-02-23)
- Fix missing assigneeSciper when creating a task manually

*1.3.10* (2022-02-22)
- Fix using url into Email and missing docLink when importing sciper
- Fix decrypting null values

*1.3.9* (2022-02-16)
- Manage the fact we can have multiple users in assigneeSciper
- Sort import scipers list element by exam candidature

*1.3.8* (2022-02-14)
- Order by student's last name for ISA lists

*1.3.7* (2022-02-14)
- Meteor 2.6.0
- BPMN: add text after 1st year

*1.3.6* (2022-02-11)
- Change label, from doctoral schools to doctoral programs
- Fix the ISA list, the elements were not updated when a new task has been added
- Rework the Task model, behind the scene

*1.3.5* (2022-02-09)
- Add info about non-persistent guests data at the top of the import sciper list

*1.3.4* (2022-02-08)
- Fix again for the thesis co director behaving wrongly when importing list

*1.3.3* (2022-02-04)
- Fix the thesis co director sciper behaving wrongly when importing list

*1.3.2* (2022-02-02)
- Meteor 2.5.6
- Automatically add dates from ISA when importing tasks (dateOfCandidacyExam, dateOfEnrolment)
- Add program director name to doctoral school details

*1.3.1* (2022-01-28)
- Remove default proposition for doctoral school selection
- Fix using wrong field when getting the current user display name
- Set better text for help text
- Fix wrong right checking on importing sciper from ISA
- Improve errors message when starting imports
- Set route paths under permission control

*1.3.0* (2022-01-26)
- Meteor 2.5.3
- Add the student info for a task in the task list
- Add the ISA importer
- Add doctoral schools data

*1.2.0* (2021-11-29)
- Meteor 2.5.1
- Set more names info to variables
- Change alert on success to be unclosable

*1.1.0* (2021-11-18)
- Set group for permissions from environment variables
- Set user notifications UI persistent for errors
- Rework User information panel, so admins can see the current version

*1.0.0* (2021-11-17)
- ✨ First day in prod !
- Starting the changelog day
