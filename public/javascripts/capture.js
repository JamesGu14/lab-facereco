// The width and height of the captured photo. We will set the
// width to the value defined here, but the height will be
// calculated based on the aspect ratio of the input stream.
var started = false;
var width = 320;    // We will scale the photo width to this
var height = 0;     // This will be computed based on the input stream

// |streaming| indicates whether or not we're currently streaming
// video from the camera. Obviously, we start at false.

var streaming = false;

// The various HTML elements we need to configure or control. These
// will be set by the startup() function.

var video = null;
var canvas = null;
var photo = null;
var startbutton = null;

function startup() {
  video = document.getElementById('video');
  canvas = document.getElementById('canvas');
  photo = document.getElementById('photo');
  startbutton = document.getElementById('startbutton');

  navigator.getMedia = (navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);

  navigator.getMedia(
    {
      video: true,
      audio: false
    },
    function (stream) {
      if (navigator.mozGetUserMedia) {
        video.mozSrcObject = stream;
      } else {
        var vendorURL = window.URL || window.webkitURL;
        video.src = vendorURL.createObjectURL(stream);
      }
      video.play();
    },
    function (err) {
      console.log("An error occured! " + err);
    }
  );

  video.addEventListener('canplay', function (ev) {
    if (!streaming) {
      height = video.videoHeight / (video.videoWidth / width);

      // Firefox currently has a bug where the height can't be read from
      // the video, so we will make assumptions if this happens.

      if (isNaN(height)) {
        height = width / (4 / 3);
      }

      video.setAttribute('width', width);
      video.setAttribute('height', height);
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      streaming = true;
    }
  }, false);

  // startbutton.addEventListener('click', function (ev) {
  //   takepicture();
  //   ev.preventDefault();
  // }, false);

  clearphoto();
}

// Fill the photo with an indication that none has been
// captured.

function clearphoto() {
  var context = canvas.getContext('2d');
  context.fillStyle = "#AAA";
  context.fillRect(0, 0, canvas.width, canvas.height);

  var data = canvas.toDataURL('image/png');
  photo.setAttribute('src', data);
}

// Capture a photo by fetching the current contents of the video
// and drawing it into a canvas, then converting that to a PNG
// format data URL. By drawing it on an offscreen canvas and then
// drawing that to the screen, we can change its size and/or apply
// other changes before drawing it.

function takepicture() {
  var context = canvas.getContext('2d');
  if (width && height) {
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    var data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
    callApi(data)
  } else {
    clearphoto();
  }
}

function callApi(data) {

  // Split the base64 string in data and contentType
  var block = data.split(";");
  // Get the content type
  var contentType = block[0].split(":")[1];// In this case "image/gif"
  // get the real base64 content of the file
  var realData = block[1].split(",")[1];// In this case "iVBORw0KGg...."

  // Convert to blob
  var blob = b64toBlob(realData, contentType);

  // Create a FormData and append the file
  var fd = new FormData();
  fd.append('file', blob);

  // Submit Form and upload file
  $.ajax({
    url: "/detect",
    data: fd,// the formData function is available in almost all new browsers.
    type: "POST",
    contentType: false,
    processData: false,
    cache: false,
    dataType: "json", // Change this according to your response from the server.
  }).done(function( result ) {
    if (result.success) {
      // var audioSection = $('hidden-audio').html()
      // $('hidden-audio').html(audioSection)

      // var audio = document.getElementsByTagName('audio')[0];
      // var source = document.getElementsByTagName('source')[0];
      // source.src = '/faces/audio.mp3'
      // audio.load()
      // audio.play()

      var audio = new Audio(result.audioPath);
      audio.load();
      audio.play();   
    }
  });
}

// Set up our event listener to run the startup process
// once loading is complete.
// window.addEventListener('load', startup, false);

$(document).ready(function () {
  $('#start').click(function () {
    if (!started) {
      started = true
      startup()
    } else {
      location.reload()
    }
  })

  setInterval(function() {
    if (started) {
       takepicture();
    }
  }, 5000)

  $('#upload-img').click(function () {
    takepicture();
  })
})

/**
 * Convert a base64 string in a Blob according to the data and contentType.
 * 
 * @param b64Data {String} Pure base64 string without contentType
 * @param contentType {String} the content type of the file i.e (detect/jpeg - image/png - text/plain)
 * @param sliceSize {Int} SliceSize to process the byteCharacters
 * @see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
 * @return Blob
 */
function b64toBlob(b64Data, contentType, sliceSize) {
  contentType = contentType || '';
  sliceSize = sliceSize || 512;

  var byteCharacters = atob(b64Data);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  var blob = new Blob(byteArrays, { type: contentType });
  return blob;
}