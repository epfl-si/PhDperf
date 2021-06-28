
Use [the Google JSON Style Guide name convention](https://google.github.io/styleguide/jsoncstyleguide.xml?showone=Property_Name_Format#Property_Name_Format)

Example BPMN with service task:

 ```xml
 <bpmn:serviceTask id="Activity_1" name="User Task">
   <bpmn:extensionElements>
     <zeebe:taskDefinition type="phdAssessFillForm" retries="0" />
     <zeebe:ioMapping>
       <zeebe:input source="= phDStudentSciper" target="assigneeSciper" />
     </zeebe:ioMapping>
     <zeebe:taskHeaders>
       <zeebe:header key="title" value="My User Task" />
       <zeebe:header key="formIO" value="{}" />
       <zeebe:header key="allowedGroups" value="aGroupName" />
     </zeebe:taskHeaders>
   </bpmn:extensionElements>
 </bpmn:serviceTask>
 ```

* the worker is registered for jobs of type `phdAssessFillForm`
* custom headers:
  * `title` - the title of the task _(optional)_
  * `formIO` (JSON) - the formIO fields
  * `allowedGroups` - the name of the group which can claim the task
* optional variables:
  * `assigneeSciper` - the name of the user which should be assigned to the task.
    As this info can not be crawled from the lane of the Activity, use the Zeebe ioMapping
