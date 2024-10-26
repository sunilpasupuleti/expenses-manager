#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>

// Added the header at the top of the file:
#import <React/RCTLinkingManager.h>

// added
#import <Firebase.h>


//added react native splash screen
#import "RNSplashScreen.h"

@implementation AppDelegate

// added this because for bug with mobile otp authetnication
// -(BOOL) application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {


//   return YES;
// }

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"expensesmanager";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};



  // added

  [FIRApp configure];

    // added new line for react native splash screen to automatically show
  //  [RNSplashScreen show];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}
 
- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}


// Added this inside `@implementation AppDelegate` above `@end`:
- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}


@end
