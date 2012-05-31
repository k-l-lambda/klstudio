
import os
import datetime
import logging
import urllib

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import mail
from google.appengine.ext.webapp import template


class NotifyHandler(webapp.RequestHandler):
    def get(self):
        message = self.request.get('msg', None)
        sendmail = self.request.get('mail', 'on') == 'on'
        redirect = urllib.unquote(self.request.get('redirect', 'static/1.png')) or 'static/1.png'

        content = ('\tTime:       \t%s\n' % datetime.datetime.now()) + \
            ('\tURL:        \t%s\n' % self.request.url) + \
            ('\tRemote Addr:\t%s\n' % self.request.remote_addr) + \
            ('\tUser Agent: \t%s\n' % self.request.headers['User-Agent']) + \
            ('\tReferer:    \t%s\n' % self.request.headers.get('Referer', '')) + \
            (message and ('\tMessage:     \t%s\n' % message))

        logging.info('Page tracer notify:\n%s', content)

        if sendmail:
            mail.send_mail(
                sender = 'K.L.Studio.indiegame@gmail.com',
                to = 'K.L.Studio.indiegame+pagetracer@gmail.com',
                subject = 'Page Tracer: %s' % message,
                body = content
            )

        self.redirect(redirect)


class GeneratorHandler(webapp.RequestHandler):
    def get(self):
        self.response.out.write(template.render(os.path.join(os.path.dirname(__file__), 'templates/generator.html'), {}))


def main():
    application = webapp.WSGIApplication([
        ('/PageTracer/',                            NotifyHandler),
        ('/PageTracer/gen',                         GeneratorHandler),
        ], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
