This is a collection of modules for crawling beat pages from various beat hosting services (Soundclick, Beatstars, Airbit, etc).

`index.js` will crawl a fixed list of beat producers and then save the results into the `dumps` folder.

The other JS files (`airbit.js`, `beatstars.js`, `shadowville.js`, `soundclick.js`, and `soundgine.js`) are modules that crawl beat pages/sites hosted by those providers.
They export a single function that take the beat producer's unique ID (in some form) as input, and returns a `Promise` that resolves to an array of beats as described in the [schema](./schema.md).
The form that the beat producer's ID takes varies depending on the hosting service. The proper form of unique ID to use will be documented in the module.

To do:
- Figure out if Soundclick's CDN still requires the legacy HTTP parser to work or if that ugly hack can be removed.
- Add a "tags" field to the schema. Many hosts, rather than using "moods" and "genres", opt for a tag system instead.
