Some questions from devs

# Open questions

**Q: Will this app cover all the job types ? like the send_email, generate_pdf, ... ?**

**A:** Needed

**Q: How to resolve the "one worker per worker_processor until timeout" ? Should the Zeebe exporter API design be used to get a workaround on this ?**

**A:** Needed


# Closed questions

**Q: How to have a global view per participant ?**
  Eg: the secretary need to know at which step the process is now, or the student about his PhD Assessement steps

**A:** Only one account that will be used by L3 staff

**Q: How dotenv works ?**

**A:** Only for the server, use Meteor methods-calls to fetch it "per need"

**Q: Do we want shared live form filling session ?

**A:** Well, as we are in the early dev process, it can be seens as a sugar over the top

**Q: As the process initiator will be the program assistant,
should we consider every choose_student step as a bach or a fire-and-forget step ?**

**A:** One instance is needed per PhD Student, so it will be a fire-and-forget with an ordered list of instance for the program assistant
