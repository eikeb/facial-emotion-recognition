sap.ui.define([
  "./BaseController",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/ui/core/format/NumberFormat"
], function (BaseController, MessageBox, MessageToast, NumberFormat) {
  "use strict";

  return BaseController.extend("de.linktwo.facerec.controller.App", {
    /** The interval handle */
    interval: null,

    /**
     * Initializes the appliation and starts the snapshot timer.
     */
    onInit: function() {
      this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

      this._initializeCameraFeed()
        .then(this._startInterval.bind(this));
    },

    /**
     * Starts the snapshot timer
     */
    onStart: function() {
      this._startInterval();
    },

    /**
     * Stops the snapshot timer
     */
    onStop: function() {
      this._stopInterval();
    },

    /**
     * Initializes the camera feed.
     * @returns {Promise} the promise
     */
    _initializeCameraFeed: async function () {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const camera = document.getElementById("camera");
        camera.srcObject = stream;
      } catch (error) {
        MessageBox.error(`Failed to get camera feed: ${error}`);
      }
    },

    /**
     * Starts an interval that takes a snapshot and analyzes it.
     */
    _startInterval: function () {
      const snapshotInterval = this.getModel("app").getProperty("/SnapshotInterval");

      this.interval = setInterval(async () => {
        await this._takeSnapshotAndAnalyze();
      }, snapshotInterval);
      this.getModel("app").setProperty("/IsIntervalSet", true);
    },

    /**
     * Stops the inteval
     */
    _stopInterval: function () {
      clearInterval(this.interval);
      this.getModel("app").setProperty("/IsIntervalSet", false);
    },

    /**
     * Get a snapshot of the camera, sends it to the backend
     * to get the facial analysis and updates the UI.
     */
    _takeSnapshotAndAnalyze: async function () {
      const snapshot = this._getCameraSnapshot();
      const results = await this._getFacialAnalysis(snapshot);

      if (results.$metadata.httpStatusCode != '200') {
        MessageBox.error("Failed to anaylze image: " + results.$metadata.httpStatusCode);
        return;
      }

      this._updateResults(results.FaceDetails);
    },

    /**
     * Takes a PNG snapshot of the camera and returns it as a
     * Base64 string.
     *
     * @returns {string} the snapshot in Base64
     */
    _getCameraSnapshot: function () {
      const camera = document.getElementById("camera");
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      const width = camera.videoWidth;
      const height = camera.videoHeight;

      canvas.width = width;
      canvas.height = height;
      context.drawImage(camera, 0, 0, width, height);

      // Return the base64 representation of the snapshot
      // Cuts of data:image/png;base64, at the beginning of the date url
      return canvas.toDataURL("image/png").substring(22);
    },

    /**
     * Passes the camera snapshot to the backend to
     * retrieve the facial analysis results.
     *
     * @param {string} snapshot the base64 snapshot
     * @returns {Promise<string>} the result
     */
    _getFacialAnalysis: async function (snapshot) {
      const response = await fetch("/facial-analysis", {
        method: "POST",
        body: JSON.stringify({
          imageBase64: snapshot
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      });

      return await response.json();
    },

    /**
     * Updates the results.
     * For each face that is detected:
     * - A bounding box is drawn in the camera feed
     * - A table with the results is shown
     *
     * @param {Array} faceDetails the list of face details
     */
    _updateResults: function (faceDetails) {
      this._updateFaceDetails(faceDetails);
      this._updateBoundingBoxes(faceDetails);
      this._updateFaceFragments(faceDetails);
    },

    /**
     * Creates a list of items to display for each face.
     *
     * @param {Array} faceDetails the list of face details
     */
    _updateFaceDetails: function (faceDetails) {
      const i18nBundle = this.getResourceBundle();
      const percentageFormat = NumberFormat.getPercentInstance({
        minFractionDigits: 2,
        maxFractionDigits: 2
      });

      let faces = [];
      faceDetails.forEach((face, index) => {
        let items = [];

        // Face recognition confidence
        items.push({
          "Label": i18nBundle.getText("label.looksLikeAFace"),
          "Value": percentageFormat.format(face.Confidence / 100)
        });

        // Gender
        items.push({
          "Label": i18nBundle.getText("label.gender" + face.Gender.Value),
          "Value": percentageFormat.format(face.Gender.Confidence / 100)
        });

        // Age Range
        items.push({
          "Label": i18nBundle.getText("label.ageRange"),
          "Value": i18nBundle.getText("text.ageRange", [face.AgeRange.Low, face.AgeRange.High])
        });

        // Beard
        if (face.Beard.Value === true) {
          items.push({
            "Label": i18nBundle.getText("label.hasBeard"),
            "Value": percentageFormat.format(face.Beard.Confidence / 100)
          });
        }

        // Beard
        if (face.Beard.Value === true) {
          items.push({
            "Label": i18nBundle.getText("label.hasBeard"),
            "Value": percentageFormat.format(face.Beard.Confidence / 100)
          });
        }

        // Mustache
        if (face.Mustache.Value === true) {
          items.push({
            "Label": i18nBundle.getText("label.hasMustache"),
            "Value": percentageFormat.format(face.Mustache.Confidence / 100)
          });
        }

        // Smiling
        if (face.Smile.Value === true) {
          items.push({
            "Label": i18nBundle.getText("label.isSmiling"),
            "Value": percentageFormat.format(face.Smile.Confidence / 100)
          });
        }

        // Glasses
        if (face.Eyeglasses.Value === true) {
          items.push({
            "Label": i18nBundle.getText("label.hasGlasses"),
            "Value": percentageFormat.format(face.Eyeglasses.Confidence / 100)
          });
        }

        // Sunglasses
        if (face.Sunglasses.Value === true) {
          items.push({
            "Label": i18nBundle.getText("label.hasSunglasses"),
            "Value": percentageFormat.format(face.Sunglasses.Confidence / 100)
          });
        }

        // Collect Emotions
        face.Emotions.forEach((emotion) => {
          if (emotion.Confidence > 50) {
            items.push({
              "Label": i18nBundle.getText("label.emotion." + emotion.Type),
              "Value": percentageFormat.format(emotion.Confidence / 100)
            });
          }
        });

        faces.push({
          "title": i18nBundle.getText("title.face", [index + 1]),
          "items": items
        })
      });

      let appModel = this.getModel("app");
      appModel.setProperty("/Faces", faces);
    },

    /**
     * Draws bounding boxes for each detected face.
     *
     * @param {Array} faceDetails the list of face details
     */
    _updateBoundingBoxes: function (faceDetails) {
      const i18nBundle = this.getResourceBundle();

      // Remove all previously added elements
      const divsToRemove = document.querySelectorAll(".camera-container > div");
      divsToRemove.forEach((div) => div.remove());

      // Create a bounding box and landsmarks for each face
      const container = document.querySelector(".camera-container");
      faceDetails.forEach((face, index) => {
        // Bounding Box
        const boundingBox = document.createElement("div");
        boundingBox.classList.add("face-boundingbox");
        boundingBox.style.height = (face.BoundingBox.Height * 100) + "%";
        boundingBox.style.left = (face.BoundingBox.Left * 100) + "%";
        boundingBox.style.top = (face.BoundingBox.Top * 100) + "%";
        boundingBox.style.width = (face.BoundingBox.Width * 100) + "%";

        // Label for Bounding Box
        const span = document.createElement("span");
        span.textContent = i18nBundle.getText("title.face", [index + 1]);
        boundingBox.appendChild(span);
        container.appendChild(boundingBox);

        // Landmarks
        const landmarksToKeep = ['eyeLeft', 'eyeRight', 'mouthLeft', 'mouthRight', 'nose'];
        const landmarks = face.Landmarks.filter((landmark) => landmarksToKeep.indexOf(landmark.Type) > -1);
        landmarks.forEach((landmark) => {
          const landmarkBox = document.createElement("div");
          landmarkBox.classList.add("face-landmark");
          landmarkBox.style.left = (landmark.X * 100) + "%";
          landmarkBox.style.top = (landmark.Y * 100) + "%";
          container.appendChild(landmarkBox);
        });
      });
    },

    /**
     * Adds or removes fragments based on the number of detected faces.
     *
     * @param {Array} faceDetails the list of face details
     */
    _updateFaceFragments: async function (faceDetails) {
      const appModel = this.getModel("app");
      const container = this.getView().byId("faces-container");
      const items = container.getItems();
      let itemsCount = items.length;

      if (itemsCount < faceDetails.length) {
        while (itemsCount < faceDetails.length) {
          const fragment = await this.loadFragment({ name: "de.linktwo.facerec.view.FaceAnalysis" });

          fragment.setModel(appModel, "app");
          fragment.bindElement("app>/Faces/" + itemsCount);
          container.addItem(fragment);

          itemsCount++;
        }
      } else if (itemsCount > faceDetails.length) {
        const itemsToRemove = items.slice(faceDetails.length - 1);
        itemsToRemove.forEach((item) => container.removeItem(item));
      }
    }
  });
});
