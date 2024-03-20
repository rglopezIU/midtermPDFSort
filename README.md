# Cloud function deploy for sort
```
gcloud functions deploy sortPDFs --runtime nodejs18 --trigger-event google.storage.object.finalize --entry-point sortUploads --trigger-resource sp24-41200-rglopez-malpdf-uploads
```