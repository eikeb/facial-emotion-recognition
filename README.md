# Facial Emotion Recognition with NodeJS, SAPUI5 and Amazon Rekognition

This application leverages the users camera to capture snapshots, which are then processed through Amazon Rekognition for facial emotion analysis.
The core functionality revolves around real-time image capturing and emotion recognition, delivering an interactive user experience.

## Requirements

- Either [yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/) for dependency management
- An AWS account and configuration for the [AWS SDK](https://aws.amazon.com/sdk-for-javascript/)
- The [Cloud Foundry CLI](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html) for deployment

## Preparation

Use `yarn` (or `npm`) to install the dependencies:

```sh
yarn install
```
(To use npm, just do `npm` instead.)

## Configure AWS SDK

For emotion recognition, the Amazon Rekognition service is used. This application uses the AWS SDK, to consume this service.
See [Configuring the AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/configuring-the-jssdk.html) for details on how to configure the *region* and *credentials*.

## Run the App

Execute the following command to run the app (backend and frontend) locally for development:

```sh
yarn start
```

As shown in the terminal after executing this command, the app is then running on http://localhost:8000/index.html.

(When using npm, do `npm start` instead.)

## Check the Code

To lint the code, do:

```sh
yarn lint
```

(Again, when using npm, do `npm run lint` instead.)

## Build the App

For an optimized self-contained build (takes longer because the UI5 resources are built, too), do:

```sh
yarn build:ui-opt
```

(When using npm, do `npm run build:ui-opt`)

## Deploy to Cloud Foundry

First, you need to login to Cloud Foundry:

```sh
cf login --sso
```

After that, deploy the application with the Cloud Foundry CLI:
```sh
cf push
```

When the deployment is done, wait for the application to start. The URL (route) to access the application is shown in the console.

## License

This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.
