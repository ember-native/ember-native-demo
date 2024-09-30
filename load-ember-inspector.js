
const extension = Extensions.extensionServer.#n.find(x => x.name === 'Ember Inspector');
(async function () {
  const e = await import('devtools://devtools/bundled/devtools-frontend/front_end/core/sdk/sdk.js');
  const s = await import('devtools://devtools/bundled/devtools-frontend/front_end/core/host/host.js');
  const d = await import('devtools://devtools/bundled/devtools-frontend/front_end/ui/legacy/theme_support/theme_support.js');
  const t = await import('devtools://devtools/bundled/devtools-frontend/front_end/ui/legacy/legacy.js');

  const f = self.buildExtensionAPIInjectedScript(extension, '', d.ThemeSupport.instance().themeName() || '', t.ShortcutRegistry.ShortcutRegistry.instance().globalShortcutKeys() || {}, () => null, {}, {}, {});

  eval(f)('ember-inspector');
  chrome.devtools.panels.create("Ember", "panes-3-16-0/assets/svg/ember-icon.svg", "panes-3-16-0/index.html");
  function addExtensionFrame({startPage: e, name: t}) {
    const frame = document.createElement("iframe");
    frame.dataset.devtoolsExtension = t;
    frame.style.display = "none";
    console.log(f);
    eval(f)('ember-inspector');
    frame.src = e;
    frame.window.chrome = window.chrome;
    document.body.appendChild(frame);
  }

  //addExtensionFrame(extension);

})()

// function addExtension(n) {
//   const i = n.startPage;
//   try {
//     const e = new URL(i).origin
//       , a = n.name || `Extension ${e}`;
//
//     if (!this.registeredExtensions.get(e)) {
//       const i = self.buildExtensionAPIInjectedScript(n, this.inspectedTabId, d.ThemeSupport.instance().themeName(), t.ShortcutRegistry.ShortcutRegistry.instance().globalShortcutKeys(), () => null);
//       s.InspectorFrontendHost.InspectorFrontendHostInstance.setInjectedScriptForOrigin(e, i)
//     }
//     this.addExtensionFrame(n)
//   } catch (e) {
//     console.error("Failed to initialize extension " + i + ":" + e);
//     return 0;
//   }
//   return !0
// }

// const extension = Extensions.extensionServer.#n.find(x => x.name === 'Ember Inspector')
// addExtension.call(Extensions.extensionServer, extension);

class ChromePort {
  postMessage() {

  }
  onDisconnect = {
    addListener() {

    }
  }
  onMessage = {
    addListener() {

    }
  }
}

function injectChrome(origin) {
  const chrome = {};
  chrome.devtools = {
    inspectedWindow: {
      tabId: 1,
      eval() {

      }
    }
  }
  chrome.runtime = {
    connect() {
      return new ChromePort();
    },
    getURL() {

    }
  }
}


const origin = 'chrome-extension://bmdblncegkenkacieihfhpjfppoconhi'
const id = 'bmdblncegkenkacieihfhpjfppoconhi';
const ext = {
  addEventListener() {},
  start() {},
  icon: 'panes-3-16-0/assets/svg/ember-icon.svg'
}
const extInfo = {
  command: 'createPanel',
  id: 'Ember [DEV]',
  page: 'panes-3-16-0/index.html',
  title: 'Ember [DEV]',
  icon: 'panes-3-16-0/assets/svg/ember-icon.svg'
};
Extensions.extensionServer.registeredExtensions.set(origin, ext)
Extensions.extensionServer.registerExtension(origin, ext)
Extensions.extensionServer.onCreatePanel(extInfo, ext)


const config = { attributes: true, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      const frames = document.getElementsByTagName('iframe');
      for (let i = 0; i < frames.length; i++) {
        const f = frames[i];
        console.log(f, origin + '/' + extInfo.page);
        if (f.src === origin + '/' + extInfo.page) {
          console.log('found');
          var script = f.contentWindow.document.createElement("script");
          script.append(`
          console.log('hi');
          debugger;
          window.chrome3 = 1;
      `);
          f.contentWindow.document.body.appendChild(script);
          observer.disconnect();
        }
      }
    } else if (mutation.type === "attributes") {
      console.log(`The ${mutation.attributeName} attribute was modified.`);
    }
  }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(document.body, config);
