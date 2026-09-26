# Personal Story Spread

September 26, 2026. Standard-risk presentation change; local only.

The collection story uses a centered headline and optional authored subtitle,
followed by two balanced CSS columns from 900px. Smaller screens retain a single
continuous reading order. Existing paragraph text and order are unchanged.
The optional subtitle follows the existing editorial validation/approval path.

No fixed section height, nested scrollbar, truncation or font shrinking is used.
Paragraphs remain intact between columns. Fitting an entire story is dependent
on its length and viewport height: the current Tigers story fits within 936px
at tested 1440px and 1920px widths. Phones and short windows scroll naturally.

Verification: isolated webpack production build, ESLint, 20 editorial/render
tests and nine browser checks across Chromium, Firefox and WebKit passed.
Desktop and mobile screenshots were inspected. The design detector reported
no findings on the changed UI files. Existing gallery-loading work was retained;
no provider uploads, deployment, commit or push was performed.
