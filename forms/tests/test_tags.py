from django.test import TestCase

from forms.tests.factories import (FormResponseFactory,
                                   InvestigationFactory,
                                   TagFactory)


class TagTest(TestCase):

    def test_tag_in_response(self):
        tag = TagFactory.create()
        form_response = FormResponseFactory.create()
        form_response.tags.set([tag])
        self.assertEqual(form_response.selected_tags, [tag])

    def test_tag_in_investigation(self):
        investigation = InvestigationFactory.create()
        tag = TagFactory.create(investigation=investigation)
        form_response = FormResponseFactory.create()
        self.assertNotEqual(form_response.form_instance.form.investigation,
                            investigation)
        self.assertNotIn(tag, form_response.taglist)
