window.onload = function () {
  'use strict';

  var Cropper = window.Cropper;
  var URL = window.URL || window.webkitURL;
  var container = document.querySelector('.img-container');
  var image = container.getElementsByTagName('img').item(0);
  var download = document.getElementById('download');
  var actions = document.getElementById('actions');
  var dataX = document.getElementById('dataX');
  var dataY = document.getElementById('dataY');
  var dataHeight = document.getElementById('dataHeight');
  var dataWidth = document.getElementById('dataWidth');
  var dataRotate = document.getElementById('dataRotate');
  var dataScaleX = document.getElementById('dataScaleX');
  var dataScaleY = document.getElementById('dataScaleY');
  var options = {
    aspectRatio: 16 / 9,
    preview: '.img-preview',
    ready: function (e) {
      console.log(e.type);
       $('#overlays').fadeOut();
    },
    cropstart: function (e) {
      console.log(e.type, e.detail.action);
    },
    cropmove: function (e) {
      console.log(e.type, e.detail.action);
    },
    cropend: function (e) {
      console.log(e.type, e.detail.action);
    },
    crop: function (e) {
      var data = e.detail;

      console.log(e.type);
      dataX.value = Math.round(data.x);
      dataY.value = Math.round(data.y);
      dataHeight.value = Math.round(data.height);
      dataWidth.value = Math.round(data.width);
      dataRotate.value = typeof data.rotate !== 'undefined' ? data.rotate : '';
      dataScaleX.value = typeof data.scaleX !== 'undefined' ? data.scaleX : '';
      dataScaleY.value = typeof data.scaleY !== 'undefined' ? data.scaleY : '';
    },
    zoom: function (e) {
      console.log(e.type, e.detail.ratio);
    }
  };
  var cropper = new Cropper(image, options);
  var originalImageURL = image.src;
  var uploadedImageType = 'image/jpeg';
  var uploadedImageName = 'cropped.jpg';
  var uploadedImageURL;

  // Tooltip
  // $('[data-toggle="tooltip"]').tooltip();

  // Buttons
  if (!document.createElement('canvas').getContext) {
    $('button[data-method="getCroppedCanvas"]').prop('disabled', true);
  }

  if (typeof document.createElement('cropper').style.transition === 'undefined') {
    $('button[data-method="rotate"]').prop('disabled', true);
    $('button[data-method="scale"]').prop('disabled', true);
  }

  // Download
  if (typeof download.download === 'undefined') {
    download.className += ' disabled';
    download.title = 'Your browser does not support download';
  }

  // Options
  actions.querySelector('.docs-toggles').onchange = function (event) {
    var e = event || window.event;
    var target = e.target || e.srcElement;
    var cropBoxData;
    var canvasData;
    var isCheckbox;
    var isRadio;

    if (!cropper) {
      return;
    }

    if (target.tagName.toLowerCase() === 'label') {
      target = target.querySelector('input');
    }

    isCheckbox = target.type === 'checkbox';
    isRadio = target.type === 'radio';

    if (isCheckbox || isRadio) {
      if (isCheckbox) {
        options[target.name] = target.checked;
        cropBoxData = cropper.getCropBoxData();
        canvasData = cropper.getCanvasData();

        options.ready = function () {
          console.log('ready');
          cropper.setCropBoxData(cropBoxData).setCanvasData(canvasData);
        };
      } else {
        options[target.name] = target.value;
        options.ready = function () {
          console.log('ready');
        };
      }

      // Restart
      cropper.destroy();
      cropper = new Cropper(image, options);
    }
  };

  // Methods
  actions.querySelector('.docs-buttons').onclick = function (event) {
    var e = event || window.event;
    var target = e.target || e.srcElement;
    var cropped;
    var result;
    var input;
    var data;

    if (!cropper) {
      return;
    }

    while (target !== this) {
      if (target.getAttribute('data-method')) {
        break;
      }

      target = target.parentNode;
    }

    if (target === this || target.disabled || target.className.indexOf('disabled') > -1) {
      return;
    }

    data = {
      method: target.getAttribute('data-method'),
      target: target.getAttribute('data-target'),
      option: target.getAttribute('data-option') || undefined,
      secondOption: target.getAttribute('data-second-option') || undefined
    };

    cropped = cropper.cropped;

    if (data.method) {
      if (typeof data.target !== 'undefined') {
        input = document.querySelector(data.target);

        if (!target.hasAttribute('data-option') && data.target && input) {
          try {
            data.option = JSON.parse(input.value);
          } catch (e) {
            console.log(e.message);
          }
        }
      }

      switch (data.method) {
        case 'rotate':
          if (cropped && options.viewMode > 0) {
            cropper.clear();
          }

          break;

        case 'getCroppedCanvas':
          try {
            data.option = JSON.parse(data.option);
          } catch (e) {
            console.log(e.message);
          }

          if (uploadedImageType === 'image/jpeg') {
            if (!data.option) {
              data.option = {};
            }

            data.option.fillColor = '#fff';
          }

          break;
      }

      result = cropper[data.method](data.option, data.secondOption);

      switch (data.method) {
        case 'rotate':
          if (cropped && options.viewMode > 0) {
            cropper.crop();
          }

          break;

        case 'scaleX':
        case 'scaleY':
          target.setAttribute('data-option', -data.option);
          break;

        case 'getCroppedCanvas':
          if (result) {
            // Bootstrap's Modal
            $('#getCroppedCanvasModal').modal().find('.modal-body').html(result);

            if (!download.disabled) {
              download.download = uploadedImageName;
              download.href = result.toDataURL(uploadedImageType);
            }
          }

          break;

        case 'destroy':
          cropper = null;

          if (uploadedImageURL) {
            URL.revokeObjectURL(uploadedImageURL);
            uploadedImageURL = '';
            image.src = originalImageURL;
          }

          break;
      }

      if (typeof result === 'object' && result !== cropper && input) {
        try {
          input.value = JSON.stringify(result);
        } catch (e) {
          console.log(e.message);
        }
      }
    }
  };

  document.body.onkeydown = function (event) {
    var e = event || window.event;

    if (e.target !== this || !cropper || this.scrollTop > 300) {
      return;
    }

    switch (e.keyCode) {
      case 37:
        e.preventDefault();
        cropper.move(-1, 0);
        break;

      case 38:
        e.preventDefault();
        cropper.move(0, -1);
        break;

      case 39:
        e.preventDefault();
        cropper.move(1, 0);
        break;

      case 40:
        e.preventDefault();
        cropper.move(0, 1);
        break;
    }
  };
  // Import Image from drop
  var file_drop = document.getElementById('fileDrop');
  // var file_dropped;
      file_drop.addEventListener(
        'dragover',
        function handleDragOver(evt) {  
          // alert('called-drop');
          evt.stopPropagation()
          evt.preventDefault()
          evt.dataTransfer.dropEffect = 'copy'
        },
        false
      )
      file_drop.addEventListener(
        'drop',
        function(evt) {
          // alert('called-copy');
          evt.stopPropagation()
          evt.preventDefault()
          var drop_files = evt.dataTransfer.files // FileList object.
          // var file = drop_files[0]         // File     object.
          console.log(evt.dataTransfer.files,evt);
          if (URL) {
            var files = drop_files;
            // console.log(drop_files);
            var file;
            // alert(drop_files[0].name);
            if (cropper && files && files.length) {
              
              file = files[0];
              // console.log('1 image');
              if (/^image\/\w+/.test(file.type)) {
                document.getElementById('main').style.overflow="visible";
                document.getElementById('main').style.height="auto";
                document.getElementById('fileDrop').style.display="none";
                $('#overlays').show();
                uploadedImageType = file.type;
                uploadedImageName = file.name;

                if (uploadedImageURL) {
                  URL.revokeObjectURL(uploadedImageURL);
                }

                image.src = uploadedImageURL = URL.createObjectURL(file);
                cropper.destroy();
                cropper = new Cropper(image, options);
                // $('#overlays').fadeOut();
                file_drop.value = null;
              } else {
                window.alert('Please choose an image file.');
              }
            }
        } else {
          file_drop.disabled = true;
          file_drop.parentNode.className += ' disabled';
          document.getElementById('main').style.overflow="hidden";
          document.getElementById('main').style.height=0;
        }

        },
        false
      )
      // alert(files[0].name);
  // Import image
  var inputImage = document.getElementById('inputImage');

  if (URL) {
    inputImage.onchange = function () {
      var files = this.files;
      // console.log(files);
      var file;
      if (cropper && files && files.length) {
        file = files[0];
        if(files[1] === undefined) {
          console.log('1 image');
          if (/^image\/\w+/.test(file.type)) {
            document.getElementById('main').style.overflow="visible";
            document.getElementById('main').style.height="auto";
            document.getElementById('fileDrop').style.display="none";
            $('#overlays').show();
            uploadedImageType = file.type;
            uploadedImageName = file.name;

            if (uploadedImageURL) {
              URL.revokeObjectURL(uploadedImageURL);
            }

            image.src = uploadedImageURL = URL.createObjectURL(file);
            cropper.destroy();
            // $('#overlays').fadeOut();
            cropper = new Cropper(image, options);
            inputImage.value = null;
          } else {
            window.alert('Please choose an image file.');
          }
        } else {
            console.log('multi images');
            var i;
            $('#multiUpload').fadeIn();
            for (i=0;i<files.length;i++){
              file=files[i];
              if (/^image\/\w+/.test(file.type)) {
                document.getElementById('main').style.overflow="visible";
                document.getElementById('main').style.height="auto";
                document.getElementById('fileDrop').style.display="none";
                // uploadedImageType = file.type;
                // uploadedImageName = file.name;

                // if (uploadedImageURL) {
                //   URL.revokeObjectURL(uploadedImageURL);
                // }
                // console.log(i);
                image.src = URL.createObjectURL(file);
                //   console.log(image);
                  // var uploads = document.getElementById('multiImages');
                  
                  $('#multiImages').append("<div class=\"image-card\"><img src='" + image.src + "'><div class=\"overlay-buttons-glry\"><div class=\"buttons\"><button type=\"button\" class=\"btn btn-primary edit-button-glry\" title=\"Edit this image\"><span class=\"fa fa-edit\"></span></button><button type=\"button\" class=\"btn btn-primary delete-button\" title=\"Delete this image\"><span class=\"fa fa-trash-o\"></span></button></div></div></div>");
            } else {
                alert('File selected not an image');
            }
          }

        }
      }
    };
  } else {
      inputImage.disabled = true;
      inputImage.parentNode.className += ' disabled';
      document.getElementById('main').style.overflow="hidden";
      document.getElementById('main').style.height=0;
  }
 


// Edit Image function

  function editImage(element) {
    if (URL) {
        var files = element;
        // console.log(element);
        var file;
        if (cropper && files && files.length) {
          file = files[0];
          if(files[1] === undefined) {
            console.log('1 image');
            uploadedImageType = file.type;
            uploadedImageName = file.name;

            if (uploadedImageURL) {
              URL.revokeObjectURL(uploadedImageURL);
            }

            image.src = uploadedImageURL = file.src;
            // console.log(image);
            cropper.destroy();
            cropper = new Cropper(image, options);
            // $('#overlays').fadeOut();
            // inputImage.value = null;
            
          }
        }
    } else {
        inputImage.disabled = true;
        inputImage.parentNode.className += ' disabled';
        /*document.getElementById('main').style.overflow="hidden";
        document.getElementById('main').style.height=0;*/
    }
  };

  function editImageGallery(element) {
    if (URL) {
        var files = element;
        // console.log(element);
        var file;
        if (cropper && files && files.length) {
            file = files[0];
            console.log('1 image');
            uploadedImageType = file.type;
            uploadedImageName = file.name;

            if (uploadedImageURL) {
              URL.revokeObjectURL(uploadedImageURL);
            }

            image.src = uploadedImageURL = file.src;
            console.log(image);
            cropper.destroy();
            cropper = new Cropper(image, options);
            // $('#overlays').fadeOut();
        }
    } else {
        inputImage.disabled = true;
        inputImage.parentNode.className += ' disabled';
        /*document.getElementById('main').style.overflow="hidden";
        document.getElementById('main').style.height=0;*/
    }
  };
  $(".edit-button").click(function(){
    $('#overlays').show();
      editImage($(this).parent().parent().prev());
    });

  $(".gallery-images").on( 'click', '.edit-button-glry',function(){
    console.log('called');
    $('#overlays').show();
      editImageGallery($(this).parent().parent().prev());
    });
  $(".gallery-images").on( 'click', '.delete-button',function(){
      // console.log($(this).parent().parent().parent().parent());
      $(this).parent().parent().parent().remove();
    });
      var dir = "images";
    var fileextension = ".jpg";
    // alert('hi');
    $.ajax({
        //This will retrieve the contents of the folder if the folder is configured as 'browsable'
        url: dir,
        success: function (data) {
            //List all .png file names in the page

            $(data).find("a:contains(" + fileextension + ")").each(function () {
              // $('#overlays').show();
              var index = 0;
                // var image_array;
                
                var filename =this.href.replace(window.location.host+'/tasks/cropper', "").replace("http://", "");
                // console.log(dir);
                // console.log(filename);
                var image_array =[];
                image_array[index]= '<img src='+'"'+ dir + filename +'"'+'>';
                // console.log(image_array);
                
                // $("body").append("<img src='" + dir + filename + "'>");
                // var gallery = document.getElementById('galleryTimeline'); for ajax won't work
                $("#galleryImages").append("<div class=\"image-card\"><img src='" + dir + filename + "'><div class=\"overlay-buttons-glry\"><div class=\"buttons\"><button type=\"button\" class=\"btn btn-primary edit-button-glry\" title=\"Edit this image\"><span class=\"fa fa-edit\"></span></button><button type=\"button\" class=\"btn btn-primary delete-button\" title=\"Delete this image\"><span class=\"fa fa-trash-o\"></span></button></div></div></div>");
                index++;
            });
        }
    });

  };

// $(".edit-button").bind("click", editImage($(this).parent().parent().prev()));
  $(".delete-button").click(function(){
      // console.log($(this).parent().parent().parent().parent());
      $(this).parent().parent().parent().parent().css("display","none");
    });
