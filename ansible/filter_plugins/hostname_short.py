import re

class FilterModule(object):
    '''
    FQDN to short hostname filter
    '''

    def filters(self):
        return {
            'hostname_short': self.hostname_short
        }

    def hostname_short(self, fqdn):
        return re.sub('[.].*$', '', fqdn)
