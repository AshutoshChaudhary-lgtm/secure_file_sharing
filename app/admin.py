from django.contrib import admin
from .models import File, Comment

class FileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'file_name', 'created_at')
    search_fields = ('file_name',)

class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'file', 'user', 'content', 'created_at')
    search_fields = ('content',)

admin.site.register(File, FileAdmin)
admin.site.register(Comment, CommentAdmin)