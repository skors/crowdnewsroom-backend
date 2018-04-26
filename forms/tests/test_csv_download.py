from unittest.mock import patch

from django.test import TestCase, Client
from django.urls import reverse

from forms.models import User
from forms.tests.factories import FormInstanceFactory


class FormReponseCSVDownloadTest(TestCase):
    def setUp(self):
        User.objects.create_superuser('admin@crowdnewsroom.org', 'password')
        self.client = Client()
        self.client.login(email='admin@crowdnewsroom.org', password='password')

    @patch('forms.admin_views.create_form_csv', return_value=None)
    def test_file_download(self, mock_create_form_csv):
        form_instance = FormInstanceFactory.create()

        response = self.client.get(reverse("form_responses_csv",
                                           kwargs={"form_slug": form_instance.form.slug,
                                                   "investigation_slug": form_instance.form.investigation.slug,
                                                   "bucket": "inbox"}))
        self.assertEquals(response.status_code, 200)
        filename = 'crowdnewsroom_download_{}_{}.csv'.format(form_instance.form.investigation.slug,
                                                             form_instance.form.slug)
        self.assertEquals(response['Content-Disposition'], 'attachment; filename="{}"'.format(filename))
        self.assertEquals(response['Content-Type'], 'text/csv')
        self.assertEquals(response.status_code, 200)

