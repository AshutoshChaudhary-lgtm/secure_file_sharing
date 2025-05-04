from django import forms

class FileUploadForm(forms.Form):
    file = forms.FileField(label='Select a file')
    comment = forms.CharField(max_length=255, required=False, label='Comment')

class CommentForm(forms.Form):
    comment = forms.CharField(max_length=255, label='Add a comment')