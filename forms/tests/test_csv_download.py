from unittest.mock import patch

from django.test import TestCase, Client
from django.urls import reverse

from forms.models import User, INVESTIGATION_ROLES
from forms.tests.factories import FormInstanceFactory, UserFactory, InvestigationFactory


class FormReponseCSVDownloadTest(TestCase):
    def setUp(self):
        self.form_instance = FormInstanceFactory.create()
        self.owner = UserFactory.create()
        self.investigation = self.form_instance.form.investigation
        self.investigation.add_user(self.owner, INVESTIGATION_ROLES.OWNER)

    @patch('forms.admin_views.create_form_csv', return_value=None)
    def test_file_download(self, mock_create_form_csv):
        self.client.force_login(self.owner)

        form_instance = self.form_instance
        response = self.client.get(reverse("form_responses_csv",
                                           kwargs={"form_slug": form_instance.form.slug,
                                                   "investigation_slug": form_instance.form.investigation.slug,
                                                   "bucket": "inbox"}))
        self.assertEquals(response.status_code, 200)
        filename = 'crowdnewsroom_download_{}_{}.csv'.format(form_instance.form.investigation.slug,
                                                             form_instance.form.slug)
        self.assertEquals(response['Content-Disposition'], 'attachment; filename="{}"'.format(filename))
        self.assertEquals(response['Content-Type'], 'text/csv')

    @patch('forms.admin_views.create_form_csv', return_value=None)
    def test_file_download_fails_if_not_logged_in(self, mock_create_form_csv):
        form_instance = self.form_instance
        response = self.client.get(reverse("form_responses_csv",
                                           kwargs={"form_slug": form_instance.form.slug,
                                                   "investigation_slug": form_instance.form.investigation.slug,
                                                   "bucket": "inbox"}))
        self.assertEquals(response.status_code, 302)
        self.assertTrue(response.url.startswith("/admin/login"))

    @patch('forms.admin_views.create_form_csv', return_value=None)
    def test_file_download_fails_for_wrong_investigation(self, mock_create_form_csv):
        other_owner = UserFactory.create()
        other_investigation = InvestigationFactory.create()
        other_investigation.add_user(other_owner, INVESTIGATION_ROLES.OWNER)

        self.client.force_login(other_owner)

        form_instance = self.form_instance
        response = self.client.get(reverse("form_responses_csv",
                                           kwargs={"form_slug": form_instance.form.slug,
                                                   "investigation_slug": other_investigation.slug,
                                                   "bucket": "inbox"}))
        self.assertEquals(response.status_code, 403)

    @patch('forms.admin_views.create_form_csv', return_value=None)
    def test_file_download_fails_for_viewer(self, mock_create_form_csv):
        viewer = UserFactory.create()
        self.investigation.add_user(viewer, "V")
        self.client.force_login(viewer)

        form_instance = self.form_instance
        response = self.client.get(reverse("form_responses_csv",
                                           kwargs={"form_slug": form_instance.form.slug,
                                                   "investigation_slug": form_instance.form.investigation.slug,
                                                   "bucket": "inbox"}))
        self.assertEquals(response.status_code, 403)
