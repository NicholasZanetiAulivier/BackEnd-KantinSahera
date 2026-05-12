// Remove the comments from the code below to add
// additional functionality.
// Note that these are only a few examples, to see
// the full list of possible parameters that you
// can add see:
//   https://cloudinary.com/documentation/upload_widget_reference
// ini contoh dengan vanilla js, contoh kalo pake next cloudinary (lebih simpel):
// https://next.cloudinary.dev/clduploadwidget/signed-uploads

const initializeUploadWidget = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/image/sign-upload', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbl9pZCI6ImFkbWluLTdmODI3YTExLWNjY2MtNGFiOC1iYzExLWViYmViMGM0MzBjNiIsInVzZXJuYW1lIjoiQWRtaW4iLCJlbWFpbCI6InZpbmNlbnRoZW5kcnkwNkBnbWFpbC5jb20iLCJzdXBlcl9hZG1pbiI6ZmFsc2UsInZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3Nzg2MjkxMjAsImV4cCI6MTc3ODYzMDAyMCwianRpIjoiZmJlMjFlYjQtOTU0YS00NzZkLWI2NjgtODRmNTBlYTNjOGUwIn0.KLXDP61DTI4De8smGe-7WyZZZWHal4cbx2D2BphZvAA'
            }
        });

        const data = await response.json();

        const myWidget = cloudinary.createUploadWidget(
            {
                // semua field harus match dg yg ada di backend
                cloudName: data.cloud_name,
                apiKey: data.api_key,
                uploadSignatureTimestamp: data.timestamp,
                uploadSignature: data.signature,
                folder: 'REDACTED', // harus match
                uploadPreset: 'REDACTED', // harus match
                uniqueFilename: true, // harus match
                // cropping: true,
                // croppingAspectRatio: 1, // 1:1, later, ini gk tau cara match (l vanilla js)
                sources: ['local']
            },
            (error, result) => {
                if (!error && result && result.event === 'success') {
                    console.log('Done! Image info: ', result.info);
                    document
                        .getElementById('uploadedimage')
                        .setAttribute('src', result.info.secure_url);
                }
            }
        );

        document.getElementById('upload_widget').addEventListener(
            'click',
            () => myWidget.open(),
            false
        );

    } catch (err) {
        console.error(err);
    }
};

initializeUploadWidget();