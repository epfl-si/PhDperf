import re
import shlex

class FilterModule(object):
    def filters(self):
        return {
            'to_shell_echo': self.to_shell_echo
        }

    def to_shell_echo(self, multiline_text):
        """
        Returns a series of shell `echo` commands that print `multiline_text`.

        The return value doesn't have any newlines in it, and therefore will fit
        e.g. on a single Dockerfile RUN line.
        """
        echos = ["echo %s" % shlex.quote(line)
                 for line in multiline_text.splitlines()]
        return " && ".join(echos)
