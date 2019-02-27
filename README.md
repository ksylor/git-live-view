## Hello and welcome!

This project is _very much_ a work in progress. You can follow along here:
https://ksylor.github.io/2018/10/06/getting-restarted.html, although I'm not guaranteed to keep up with that, sorry

Things are mostly in a state where you can start to use it, but be warned these are very early days, there are definitely large quantities of bugs (for example the whole thing tends to break when you rebase, but a page refresh should fix that), and I am still actively changing things at fundamental levels.

Cheers,
Katie

## Running the git live viewer

Start by cloning this repo to your local machine. You can click on the big green "Clone or Download" button in the upper right of this page for options and really useful help content.

You will enter something along the lines of this in your command line:

```
git clone https://github.com/ksylor/git-live-view.git
```

Once you have the repo cloned to your local machine, make sure that you have Node.js and npm installed. [This blog post has good step-by-step instructions](https://www.taniarascia.com/how-to-install-and-use-node-js-and-npm-mac-and-windows/)

Install all of the project's dependencies using the command

```
npm install
```

After you have all the dependencies installed successfully (hopefully this was really easy!), start the git live viewer via the command

```
npm run watch -- repo=path_to_the_repo_folder_you_want_to_watch
```

The path to the repo you want to watch can be absolute or relative - any kind of glob path to the folder will work! Some examples:

```
// watch the current repo
npm run watch -- repo=./
```

```
// also watch the current repo
// (assuming this repo is installed in your home directory)
npm run watch -- repo=~/git-live-view
```

```
// watch a sibling directory
npm run watch -- repo=../example
```

## What happens next?

The process should automatically open up a browser window that displays the viewer UI. If you open a new terminal window and access the repo that you passed in as a parameter, then start editing/adding/committing/pushing etc. you should see the UI update _in real time_ to reflect your changes.

When you are all done, `ctrl+c` in the original terminal window to shut the whole thing down.