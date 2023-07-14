![Logo](https://expenses-manager.webwizard.in/graphics/EXPENSES%20MANAGER.jpg)

# Expenses Manager

Spend Better, Live Better

Expenses Manager has been crafted to keep track of your spending effortlessly, with useful features in a simple, intuitive interface. And with Back up, it's easy to keep all your expenses in sync across your devices.

## APK

https://play.google.com/store/apps/details?id=com.webwizard.expensesmanager

## Screenshots

Android  
:-------------------------:
![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/android/1.png) ![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/android/2.png) ![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/android/3.png)
![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/android/4.png) ![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/android/5.png) ![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/android/6.png)
![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/android/7.png) ![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/android/8.png) ![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/android/9.png)

IOS  
:-------------------------:
![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/ios/1.png) ![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/ios/2.png) ![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/ios/3.png)
![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/ios/4.png) ![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/ios/5.png) ![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/ios/6.png)
![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/ios/7.png) ![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/ios/8.png) ![App Screenshot](https://expenses-manager.webwizard.in/graphics/reduced/ios/9.png)

## Features

- Data Encryption

  Your data is encrypted safely, no one else can read it.

- Smart Scanning

  Now scan your receipt/bill directly from the camera and get your expense noted automatically with category filtration and date.

- Exporting

  Export all transactions you enter in multiple ways meaning that you can still make full use of data as you want

- Manage multiple accounts

  You can create multiple accounts and manage them separately, You can also link different currencies to different accounts.

- Categories

  You can detail your category and can add the 'N' number of categories in Expense and Incom.

  You can add a category by preferred name, icon and colour to easily identify

- Dashboard Analysis

  A separate dashboard is maintained for every account. Category-wise transactions and their usable percentages are shown

- Account Stats

  You can view the complete analysis and its details in the form of a pie chart.

- Account Trends

  You can view the last 14 days and last 12 months analysis in the form of a Trend chart and line chart

- Account Options

  you can perform actions such as Archive, Pin, Edit, Delete

- Add Image

  You can add an Image to every transaction for future reference

- Currency Rates

  You can get the latest currency rates related to the currency that is linked with the account

- Export in multiple formats

  You can export your data in different Formats like PDF, EXCEL, JSON

- Import from JSON

  You can Export the JSON file and can import all the accounts and transactions from the JSON file in future in case of app loss.

- All Currencies available

  Expense Manager supports all currencies you may need especially when travelling. It also supports automatically updated currency rates for major currencies

- Reminder Notifications

  You can set your daily reminder notification at your preferred time, to get you notified to add the transactions of the day that were missing

- Daily Backup

  It's ok don't get worried about your transactions by manually backing up daily. Sit back and relax we will handle it by backing up your data daily at 12:00 AM

- Previous 10 Restores

  You can restore your data from the past 10 backups

- App Lock

  You can enable the App Lock to secure your app and your transactions. You can also configure the custom pin to your app as a fallback method.

- Quick input

  Enter your expense quickly and easily with minimum effort

- All the small things

  Dark Mode, Quick Actions, Context menus, Swipeable actions

## Installation

\*\* You must have a google developer account to run this project.

If you already have a developer account dont forgot to link billing account, becausesome api's that we use like Google Cloud Vision requires.

you can check the Google Cloud Vision API pricing from https://cloud.google.com/vision/

1. First create the new project in Firebase
   Guide - https://cloud.google.com/firestore/docs/client/get-firebase

2. Login to your google cloud console from here https://console.cloud.google.com/ and navigate to the project you have created from firebase.

3. Create API CREDENTIALS using this guide https://support.google.com/googleapi/answer/6158862?hl=en

4. Enable the following Libraries for your project in Google Cloud

   Cloud Messaging

   Cloud Vision Api

   Android Device Verification

5. Go to https://console.firebase.google.com/ and navigate to the project you have created

6. Enable the following Authentication providers from Firebase Sign in methods

   Email/Password

   Google

   Phone

7. Enable Following services from firebase

   Firestore Database

   Realtime Database

   Storage

   Cloud Messaging

   App Check

8. Generate the SHA Fingerprints https://aboutreact.com/getting-sha1-fingerprint-for-google-api-console/

9. From Project Settings link your project to Android and IOS

10. Huff, I know its lot, Finally lets move to next part. How to run locally

## Config Files

To run this project, you will need to add the following configuration files to the Project.

- Create .env file in root of BACKEND directory with following values

```bash
  PORT=3000
  FIREBASE_DATABASE_URL=https://<firebase database url provided to you from FIREBASE.>/
  FIREBASE_STORAGE_BUCKET=<firebase storage bucket url Ex : teest-da065.appspot.com>
```

- Create config.js file in root of APP directory with following values

```bash
 export const BACKEND_URL ='http://<your backend url where u have hosted or started>';
 export const WEB_CLIENT_ID = '<Web client id from Firebase console>';
 export const GOOGLE_API_KEY = 'Credentials/API we have created in the installation step from Google Cloud Platform';
 export const GOOGLE_CLOUD_VISION_API_URL ='https://vision.googleapis.com/v1/images:annotate';

```

- Generate Service account Json file from firebase and place the file in the root of BACKEND directory
- Follow this guide to Generate Serivce Account file for backend https://sharma-vikashkr.medium.com/firebase-how-to-setup-a-firebase-service-account-836a70bb6646

- Filename shoule be <expensesmanager.json>

## Run Locally

After completing all the above steps. Now you can run the project locally.

Clone the project

```bash
  git clone https://github.com/sunilpasupuleti/expenses-manager.git
```

Go to the 'APP' directory

```bash
  cd app
  npm install
```

Go to the 'BACKEND' directory

```bash
  cd backend
  npm install
```

Start the app

- To run in Android

Run the emulator or connect the physical android device and go to APP directory

```bash
    npx react-native run-android
```

- To run in IOS use Xcode or Emulator from mac

```bash
    npx react-native run-ios
```

## Tech Stack

**Client:** React Native, Redux, Firebase, GCP

**Server:** Node, Express, CRON JS, Firebase Admin Sdk, Cloud Messaging

## More Projects

- [Awesome 3d haunted-house](https://3d.webwizard.in/haunted-house)
- [Ecommerce](https://ecommerce.webwizard.in/)
- [Visitor Management System](https://github.com/sunilpasupuleti/visitor-management-system)

## Authors

- [@sunilpasupuleti](https://www.github.com/sunilpasupuleti)

## License and more

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

## 🚀 About Me

I'm a full stack developer...

## Support

For support or feedback , reach me at sunil@webwizard.in

                    or

contact me at &nbsp;&nbsp; +91 9959907940

## 🔗 Links

[![portfolio](https://img.shields.io/badge/my_portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://webwizard.in/)

[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sunil-kumar-pasupuleti/)

[![twitter](https://img.shields.io/badge/twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/sunil_webwizard)
