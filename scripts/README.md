# Profile art

Every image on the profile page is an SVG made by `gen_profile.js`.
It borrows the project icons straight from the flick.systems page, so the two stay in sync.

```bash
node scripts/gen_profile.js ../new-flick.systems/index.html assets
```

Edit the text, projects or colours at the top of each section in the script, run it, and commit `assets/`.
GitHub caches profile images, so give an SVG a new file name when you need a change to show up straight away.
