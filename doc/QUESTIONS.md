Some questions from devs

# Open questions

**Q: As the process initiator will be the secretary,
should we consider every choose_student step as a bach or a fire-and-forget step ?**

**A:** Needed

**Q: How to resolve the "one worker per worker_processor until timeout" ? Should the Zeebe exporter API design be used to get a workaround on this ?**

**A:** Needed


# Closed questions

**Q: How to have a global view per participant ?**
  Eg: the secretary need to know at which step the process is now, or the student about his PhD Assessement steps

**A:** Only one account that will be used by L3 staff

**Q: How dotenv works ?**

**A:** Only for the server, use Meteor methods-calls to fetch it "per need"
