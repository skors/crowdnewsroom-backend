from . import secrets# TODO: Replace with included module once updated to python 3.6

from django.contrib.auth.models import User, Group
from django.db import models
from django.contrib.postgres.fields import JSONField
from django.db.models.aggregates import Func
from django.dispatch import receiver
from guardian.shortcuts import assign_perm


class ObjectAtPath(Func):
    function = '#>'
    template = "%(expressions)s%(function)s'{%(path)s}'"
    arity = 1

    def __init__(self, expression, path, **extra):
        # if path is a list, convert it to a comma separated string
        if isinstance(path, (list, tuple)):
            path = ','.join(path)
        super().__init__(expression, path=path, **extra)


class Investigation(models.Model):
    STATUSES = (
        ('D', 'Draft'),
        ('P', 'Published'),
        ('A', 'Archived')
    )
    name = models.CharField(max_length=200)
    cover_image = models.FileField(blank=True, null=True, default=None)
    logo = models.FileField(blank=True, null=True, default=None)
    short_description = models.TextField()
    category = models.TextField() # What is this?
    research_questions = models.TextField()
    status = models.CharField(max_length=1, choices=STATUSES, default='D')
    # The following fields might be separate?
    text = models.TextField() # or is this the same as short_description?
    methodology = models.TextField()
    faq = models.TextField()

    class Meta:
        permissions = (
            ('view_investigation', 'View investigation'),
            ('manage_investigation', 'Manage investigation'),
        )

    def __str__(self):
        return self.name


class UserGroup(models.Model):
    ROLES = (
        ('O', 'Owner'),
        ('A', 'Admin'),
        ('E', 'Editor'),
        ('A', 'Auditor'),
        ('V', 'Viewer')
    )
    investigation = models.ForeignKey(Investigation, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    role = models.CharField(max_length=1, choices=ROLES, default='V')

    def assign_permissions(self):
        assign_perm("view_investigation", self.group, self.investigation)
        if self.role in ["O", "A"]:
            assign_perm("manage_investigation", self.group, self.investigation)

    @classmethod
    def create_all_for(cls, investigation):
        for (key, name) in cls.ROLES:
            group_name = "{} - {}s".format(investigation.name, name)
            group = Group(name=group_name)
            group.save()

            user_group = UserGroup(role=key, investigation=investigation, group=group)
            user_group.save()

            user_group.assign_permissions()


@receiver(models.signals.post_save, sender=Investigation)
def execute_after_save(sender, instance, created, *args, **kwargs):
    investigation = instance
    if created:
        UserGroup.create_all_for(investigation)


class Partner(models.Model):
    name = models.CharField(max_length=200)
    logo = models.FileField()
    url = models.TextField(max_length=1000)
    investigation = models.ForeignKey(Investigation, on_delete=models.CASCADE)


class Form(models.Model):
    STATUSES = (
        ('D', 'Draft'),
        ('U', 'Unlisted'),
        ('P', 'Published'),
        ('C', 'Closed'),
        ('A', 'Archived')
    )
    name = models.CharField(max_length=200)
    status = models.CharField(max_length=1, choices=STATUSES, default='D')
    investigation = models.ForeignKey(Investigation, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class FormInstance(models.Model):
    form_json = JSONField()
    ui_schema_json = JSONField(default={})
    version = models.IntegerField(default=0)
    form = models.ForeignKey(Form, on_delete=models.CASCADE)

    def __str__(self):
        return "{} - Instance version {}".format(self.form.name, self.version)


class FormResponse(models.Model):
    STATUSES = (
        ('D', 'Draft'),
        ('S', 'Submitted'),
        ('V', 'Verified'),
        ('I', 'Invalid')
    )
    json = JSONField()
    form_instance = models.ForeignKey(FormInstance, on_delete=models.CASCADE)
    status = models.CharField(max_length=1, choices=STATUSES, default='D')
    token = models.CharField(max_length=256, db_index=True, default=secrets.token_urlsafe)
    submission_date = models.DateTimeField()

    @staticmethod
    def get_signatures():
        responses = FormResponse.objects \
                                .annotate(signatures=ObjectAtPath('json', ['formData', 'signature'])) \
                                .values_list('signatures', flat=True)
        return responses

    def rendered_fields(self):
        form_data = self.json.get("formData")
        ui_schema = self.json.get("uiSchema")
        for name, props in self.json.get("schema", {}).get("properties", {}).items():
            row = {"title": props.get("title")}
            if ui_schema.get(name, dict()).get("ui:widget") == "signatureWidget":
                row["type"] = "image"
                row["value"] = form_data.get(name, "")
            elif props.get("type") == "boolean":
                row["type"] = "text"
                row["value"] = "Yes" if form_data.get(name) else "No"
            else:
                row["type"] = "text"
                row["value"] = form_data.get(name, "")
            yield row

    @classmethod
    def belongs_to_investigation(cls, form_response_id, investigation_id):
        response = FormResponse.objects.select_related('form_instance__form__investigation').get(id=form_response_id)
        return response.form_instance.form.investigation_id == investigation_id


class Comment(models.Model):
    author = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    date = models.DateTimeField()
    form_response = models.ForeignKey(FormResponse, on_delete=models.CASCADE)
    text = models.TextField()
