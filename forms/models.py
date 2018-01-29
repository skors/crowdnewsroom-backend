import secrets

from django.db import models
from django.contrib.postgres.fields import JSONField


class Investigation(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Form(models.Model):
    form_json = JSONField()
    ui_schema_json = JSONField(default={})
    version = models.IntegerField(default=0)
    investigation = models.ForeignKey(Investigation, on_delete=models.CASCADE)


class FormResponse(models.Model):
    STATUSES = (
        ('D', 'Draft'),
        ('S', 'Submitted'),
        ('V', 'Verified')
    )
    json = JSONField()
    form = models.ForeignKey(Form, on_delete=models.CASCADE)
    status = models.CharField(max_length=1, choices=STATUSES, default='D')
    token = models.CharField(max_length=256, db_index=True, default=secrets.token_urlsafe())
