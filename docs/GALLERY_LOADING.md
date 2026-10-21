# Collection loading transition

Collections with photographs show a full-screen Thinking Orbs state while their
cover and gallery images load. The page markup and images render beneath it so
the browser can start requests immediately. All gallery images request eagerly;
the cover retains high priority and later frames use low priority. The screen
closes once every rendered image has loaded or failed. An image error falls back
to the existing per-frame retry state rather than holding the whole book.

After 12 seconds, visitors can continue to the photobook while remaining images
load. Empty collections reveal their preparation state immediately. Without
JavaScript, a `noscript` rule leaves the collection visible. If the browser has
JavaScript enabled but its client files fail to load, CSS clears the
server-rendered loading screen after 12 seconds so the book remains accessible.
If client files arrive after that fallback, hydration keeps the book revealed.

This is a presentation choice: waiting for an entire book can increase time to
first content and transfer more data than lazy loading. In one local desktop
Chrome run, Tigers appeared after about 4.5 seconds and New York after about
2.9 seconds. Those are single-run observations, not production performance
claims. Browser regression checks hold, fail, and delay image requests to test
the transition and recovery path, including a failed client-script load.

## Verification

`npm run build`, `npm run lint`, `npm run test:gallery`, and
`npm run test:browser:build` passed. Focused Playwright checks in Chromium,
Firefox, and WebKit passed for blocked client scripts, reduced motion, and
JavaScript arriving after the CSS fallback while photographs were pending.
Normal delayed-image, slow-load, and no-JavaScript paths passed in Firefox;
they also passed in Chromium and WebKit before the late-hydration correction.

## Bookshelf preview transition

The shelf's preview dialog now applies its own Thinking Orbs gate before its
hinged opening. It observes the actual responsive photograph, animated cover
and map images, including cached completion, and waits for `decode()` rather
than merely a network load event. The opening timeline stays paused; the paper
spread is hidden and inert until ready. An empty volume opens immediately.

Return to shelf/Escape always cancels. A slow preview offers an explicit
Continue to book after12s; an image failure offers Retry photographs or
Continue to book. Retry remounts only the image requests, preserving the dialog
and paused animation. Late completion from a dismissed/retried preview cannot
change a new book. Reduced motion reveals the prepared spread without a hinge
animation. The complete gallery retains its separate existing loading policy.

Validation for this extension is recorded under “Preview photograph transition”
in `PHOTOBOOK_BOOKSHELF.md`; older gallery results above retain their historical
scope. No deployment is part of this local change.
