from django.contrib import admin
from .models import FileShareNotification, CommentNotification

class FileShareNotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'file_name', 'timestamp')
    search_fields = ('user__username', 'file_name', 'message')

class CommentNotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'file', 'comment', 'timestamp')
    search_fields = ('user__username', 'file__name', 'comment')

admin.site.register(FileShareNotification, FileShareNotificationAdmin)
admin.site.register(CommentNotification, CommentNotificationAdmin)