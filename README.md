Garden-Menu-Widget
==================

Consistent navigation menu for your couchapps. Easy to use!

[![Build Status](https://secure.travis-ci.org/garden20/garden-menu-widget.png)](http://travis-ci.org/garden20/garden-menu-widget)

Getting Started - Easiest Integration
======================================

  1. Copy dist/topbar.min.js into your project.
  2. Add a script tag to it, eg ```<script type="text/javascript" src="topbar.min.js"></script>```
  3. Done!


Options
-------

You can pass options to your script as query params, eg:

```<script type="text/javascript" src="topbar.min.js?disablePouch=true&position=fixed"></script>```


Reasons
-------


I will explain some of the rational of this topbar, and integration options. Grab a drink, and dig in....

1. **A common navigation metaphor across apps/modules/etc.**
Making a statement about how navigation works will actually improve the quality of apps/modules that want to play well together. No longer will each module have to reinvent/rethink how it fits into the navigation flow. Abstracting the common tasks of the eco-system like navigation, login in/out, and the topbar look and feel make it much easier for app/module writers to focus on delivering reusable components.

3. **Dynamic apps/modules***
The Fauxton plugin system is good for compile time modules, and possible some runtime modification. This topbar extends that to allow for dynamic installation of other apps/modules from open markets. This has the benefit of allowing fauxton to be a smaller set of features. Users can choose how to extend their UI and couchdb  much easier after installation.

4. **Multiple integration points**
I have tried to be flexible about how one can add this topbar to their application. Each has pros/cons but it allows the app (including fauxton) to decide which way it chooses. Here are some of the options (from easy to hard):

      a. simply include the topbar.js as a script. This is brainless integration. One script tag and done. The code should leak no globals, except the garden_menu if one chooses to use some of its features. In this model, it should not matter (much) what dependencies the topbar uses. One small feature I have yet to add is telling the topbar to make its dependencies available to the app/module. This can allow for better code reuses, and overall size.

      b. Use amd. The topbar will be fully amd compatible. This way apps/modules can pass their dependencies into the topbar. For example fauxton is using jquery, so one can pass $ into the topbar with no issues. I expect to add this to the fauxton version. So that will get rid of a whole whack of duplicated depends.

     c. Just the links please. If one wants to, one can include the topbar code and suppress the display of any topbar. It will can return just the relevant links to installed apps, etc so they can be shown however one wants. There is a simpler module here: https://github.com/garden20/garden-menu-widget/blob/master/jam/garden-menu/garden-menu.js#L38 also if one wants.

5. **Dynamic Upgradability**
The topbar itself can be updated. Basically the format is like this:

```
script tag integration
<script src="/dashboard/_design/dashboard/_rewrite/js/topbar.js" onerror="topbarLocal()"></script>
```

```
amd integration
try {
    require(['/dashboard/_design/dashboard/_rewrite/js/garden_menu.amd.js'], on_garden_menu);
} catch(e) {
    require(['./js/garden_menu.amd.js'], on_garden_menu);
}

```

(disclaimer. The dashboard db is where things are currently stored when apps are turned on. This can be changed to a better name) The point is that the app does not have to be tied to the local topbar, and usually should not. This allows the topbar (called dashboard in the apps page) to be updated via the update button on the apps page.

6. **Easy offline support.**
One reason the topbar is a bit large is that is has pouch bundled with it. Clicking the offline button (beside the profile thing) will take it offline. Again, having a common offline sync metaphor will be nice across apps. Also the complete topbar (either amd or script tag) is one .js entry to add to a app.appcache for each app that wants to go offline.

7. **Theming/Customization**
Another end goal is complete customization, showing various things etc. There is a pecking order for this.
Basically the couch owner gets final say. I want my topbar to be green and say "Ryan's App Extravaganza". A admin can configure this and these settings get stored in a db. Second in line are an app can specify some things when it loads the topbar. Third are defaults.
See here:https://github.com/garden20/garden-menu-widget/blob/fauxton/garden-menu-widget.js#L88-L93
I have not got there yet, but stylesheets will be able to be chosen from theme bundles.








