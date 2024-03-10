tinymce.init({
    selector: '#risktinymce',
    height: 500,
    menubar: false,
    plugins: 'advlist autolink lists link image charmap preview searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
    toolbar: 'undo redo | formatselect | ' +
    'bold italic backcolor | alignleft aligncenter ' +
    'alignright alignjustify | bullist numlist outdent indent | ' +
    'removeformat | fullscreen |help',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
  });