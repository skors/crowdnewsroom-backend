from unittest.mock import patch

from django.http import Http404
from django.test import TestCase

from forms.admin_views import _get_file_data
from forms.tests.factories import FormResponseFactory, UserFactory, InvestigationFactory, FormFactory, \
    FormInstanceFactory


class ResponseFileDownloadTest(TestCase):
    def setUp(self):
        self.owner = UserFactory.create()
        self.investigation = InvestigationFactory.create()
        self.investigation.add_user(self.owner, "O")
        self.form = FormFactory.create(investigation=self.investigation)
        self.form_instance = FormInstanceFactory.create(form=self.form)

    def test_get_file_data(self):
        file_base64 = "data:image/gif;name=spacer.gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAQAIBRAA7"
        file_name, file_type, file_content = _get_file_data(file_base64)
        self.assertEqual(file_name, "spacer.gif")
        self.assertEqual(file_type, "image/gif")
        self.assertTrue(file_content.startswith(b"GIF89"))

    def test_get_file_data_no_file_name(self):
        file_base64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAQAIBRAA7"
        file_name, file_type, file_content = _get_file_data(file_base64)
        # check this for now although we can't really assume it is always a signature
        self.assertEqual(file_name, "signature.png")

    def test_get_file_data_no_file(self):
        file_not_base64 = "I am just a string, not a base64 file..."
        with self.assertRaises(Http404):
            _get_file_data(file_not_base64)

    @patch('forms.admin_views._get_file_data', return_value=("filename.png", "image/png", "c"))
    def test_file_download(self, mock_get_file_data):
        form_response = FormResponseFactory.create(json={"file_field": "data:image/png;base64,abc123"},
                                                   form_instance=self.form_instance)
        self.client.force_login(self.owner)

        response = self.client.get("/forms/admin/investigations/{}/forms/{}/responses/{}/files/file_field".format(self.investigation.slug, self.form.slug,form_response.id))
        self.assertEquals(response.status_code, 200)

        expected_content_disposition = 'inline; filename="{}-filename.png"'.format(form_response.id)
        self.assertEquals(response['Content-Disposition'], expected_content_disposition)

    def test_file_download_multiple_off_by_one(self):
        form_response = FormResponseFactory.create(json={"file_field": ["data:image/png;base64,abc123",
                                                                        "data:image/png;base64,abc123"]},
                                                   form_instance=self.form_instance)
        self.client.force_login(self.owner)

        response = self.client.get("/forms/admin/investigations/{}/forms/{}/responses/{}/files/file_field/2".format(self.investigation.slug, self.form.slug,form_response.id))
        self.assertEquals(response.status_code, 404, "should return 404 if user is trying to get file 3 but there are only 2")

    def test_file_download_fails_if_not_logged_in(self):
        form_response = FormResponseFactory.create(json={"file_field": ["data:image/png;base64,abc123"]},
                                                   form_instance=self.form_instance)

        response = self.client.get("/forms/admin/investigations/{}/forms/{}/responses/{}/files/file_field/2".format(self.investigation.slug, self.form.slug,form_response.id))
        self.assertEquals(response.status_code, 302)
        self.assertTrue(response.url.startswith("/admin/login"))

    def test_file_download_fails_for_wrong_user(self):
        other_owner = UserFactory.create()
        other_investigation = InvestigationFactory.create()
        other_investigation.add_user(other_owner, "O")

        form_response = FormResponseFactory.create(json={"file_field": ["data:image/png;base64,abc123"]},
                                                   form_instance=self.form_instance)

        self.client.force_login(other_owner)

        response = self.client.get("/forms/admin/investigations/{}/forms/{}/responses/{}/files/file_field/2".format(self.investigation.slug, self.form.slug,form_response.id))
        self.assertEquals(response.status_code, 403)

    def test_file_download_fails_for_wrong_investigation(self):
        other_owner = UserFactory.create()
        other_investigation = InvestigationFactory.create()
        other_investigation.add_user(other_owner, "O")

        form_response = FormResponseFactory.create(json={"file_field": ["data:image/png;base64,abc123"]},
                                                   form_instance=self.form_instance)

        self.client.force_login(other_owner)

        response = self.client.get("/forms/admin/investigations/{}/forms/{}/responses/{}/files/file_field/2".format(other_investigation.slug, self.form.slug,form_response.id))
        self.assertEquals(response.status_code, 403)
