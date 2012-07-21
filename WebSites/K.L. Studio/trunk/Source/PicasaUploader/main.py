
import os
import logging
import re
import urllib

from xml.dom.minidom import parseString

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.ext.blobstore import BlobInfo


class HomeHandler(webapp.RequestHandler):
    def get(self):
        images = BlobInfo.all()

        path = os.path.join(os.path.dirname(__file__), 'templates/album.html')
        self.response.out.write(template.render(path, {'images': images}))


class DeleteImageHandler(webapp.RequestHandler):
    def post(self):
        keys = self.request.get_all('key')
        images = BlobInfo.get(keys)
        for image in images:
            image.delete()
            logging.info('Image "%s" deleted.', image.key())

        self.redirect('./')


class InstallHandler(webapp.RequestHandler):
    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'templates/install.html')
        self.response.out.write(template.render(path, {}))


class UploadHandler(webapp.RequestHandler):
    def post(self):
        #logging.info('body: %s' % self.request.body)
        #self.response.out.write('<pre>%s</pre>' % self.request.body)

        dom = parseString(re.compile('<\?xml.*</rss>', re.S).findall(self.request.body)[0])
        images = [{'thumb': item.getElementsByTagName('photo:thumbnail')[0].childNodes[0].data, 'src': item.getElementsByTagName('photo:imgsrc')[0].childNodes[0].data} for item in dom.documentElement.getElementsByTagName('channel')[0].getElementsByTagName('item')]

        upload_url = blobstore.create_upload_url('/projects/PicasaUploader/upload-image')
        #logging.info('upload_url: %s', upload_url)

        path = os.path.join(os.path.dirname(__file__), 'templates/upload.html')
        self.response.out.write(template.render(path, {'images': images, 'upload_url': upload_url}))


class UploadImageHandler(blobstore_handlers.BlobstoreUploadHandler):
    def post(self):
        upload_files = self.get_uploads()
        logging.info('blob_infos: %s', [blob_info.key() for blob_info in upload_files])
        self.response.out.write(self.request.url + '/../')


class ViewImageHandler(blobstore_handlers.BlobstoreDownloadHandler):
    def get(self):
        key = self.request.get('key')
        blob_info = blobstore.BlobInfo.get(key)
        self.send_blob(blob_info)

def main():
    application = webapp.WSGIApplication([
        ('/projects/PicasaUploader/',                       HomeHandler),
        ('/projects/PicasaUploader/install',                InstallHandler),
        ('/projects/PicasaUploader/upload',                 UploadHandler),
        ('/projects/PicasaUploader/upload-image',           UploadImageHandler),
        ('/projects/PicasaUploader/viedw-image',            ViewImageHandler),
        ('/projects/PicasaUploader/delete-image',           DeleteImageHandler),
        ], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
