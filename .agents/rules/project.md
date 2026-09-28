---
trigger: model_decision
description: about this project
---

# Home Item Finder: Project Summary

## 1. Problem

My mom likes to keep things but tends to forget where she put them. Most of what she stores is used only occasionally. She was asked to keep a written log before and never did.

So the design is **no logging at all**: a photo is the record, and items are found later by text search.

## 2. Design Principles

1. **Minimal effort when saving:** take a photo, optionally type a short text, done.
2. **No fields for location, name, category or tags:** the location is visible in the photo, so she is told to shoot the spot where the item sits.
3. **Fuzzy search:** typing "neck pillow" should find the neck pillow photo even if nothing was typed when saving.
4. **Fully local:** no server, and data never leaves the phone.

## 3. Features (this is all)

| Feature | Details |
|---|---|
| Save an item | Open the camera, take a photo, add an optional short text, tap "Save" |
| Search | Type or speak any words; results are photos ranked by similarity |
| Full-size view | Tap a photo to enlarge it and see where the item sits |
| Backup | Export/import button (data lives only on the device) |

Deliberately left out: reminders, expiry dates, categories, floor plans, QR codes, family sharing.

## 4. Screens (3)

1. **Home:** a big search box, photo results, and a single "Save new item" button.
2. **Camera / save:** camera view with the hint "Include where it's kept", an optional text field, and a save button.
3. **Full-size photo:** the enlarged photo with back and delete buttons.

Visual direction: large text and buttons, strong contrast, dark mode support.

## 5. Technology

**App type:** PWA (a web app added to the home screen), hosted on GitHub Pages or Cloudflare Pages. HTTPS is required.

**Libraries (3):**
- **Transformers.js** (v3.1.0 or later): runs the model in the browser, loadable from a CDN.
- **Dexie:** a wrapper around IndexedDB for storing photos (Blobs), vectors and text.
- **JSZip:** bundles all photos into a single backup file.

**No library needed for:**
- Camera: `getUserMedia` (fallback: `<input type="file" accept="image/*" capture="environment">`)
- Resizing photos before storing (longest side around 800 px): canvas
- Voice search: Web Speech API
- Search: a plain JavaScript loop computing dot products
- PWA: hand-written `manifest.json` and service worker

## 6. How Search Works

```
Save:    photo -> resize -> image encoder -> vector -> stored with the original photo
         text (if any) -> text encoder -> second vector -> stored too

Search:  query -> text encoder -> vector -> compare with every item -> rank by score
         (item score = the higher of its photo score and its text score)
```

- The model is **pre-trained** by its authors so that images and text with matching meaning land close together in vector space. **We do not train a model and do not need our own training data.**
- Mom's photos are not used for training. The model only reads them and turns them into vectors.
- Vectors only work with the model that produced them, so **always keep the original photo** and record the model version, in case everything must be recomputed after switching models.
- Process photos in the background after "Save" (store the photo first, compute the vector afterwards; if unfinished, resume next time the app opens).
- Show results as a ranking, not with a fixed score cutoff, because the score does not mean "found / not found".

## 7. Chosen Model

**First choice: `jinaai/jina-clip-v2`** (Hugging Face)

- Multilingual, with `th` (Thai) in its language list.
- Has an ONNX version and is tagged transformers.js.
- Supports text-to-image and text-to-text search in one vector space.
- Works with Transformers.js from v3.1.0.

**Caveats:**
- License is **cc-by-nc-4.0**: non-commercial use only (fine for use at home).
- **File size is not yet confirmed.** Check the Files tab on the model page; it may be heavy for older phones.
- A Thai language tag **does not guarantee accuracy on everyday Thai household items**; it must be tested.
- For actual usage code, follow the Transformers.js example on the model card.

**Fallback:** if the model is too big, look for a smaller multilingual model (for example the SigLIP 2 family, not yet checked for Transformers.js support). Write the code so the model name can be changed in one place.

## 8. Risks and Notes

| Issue | Details | Mitigation |
|---|---|---|
| First download | The model file is large | Download on Wi-Fi, show a progress screen, then cache for offline use |
| Small items in wide shots | The model struggles to capture small objects in a wide scene | Optional extra close-up photo, plus text as a booster |
| Data lives only on the device | Lost device or cleared data means lost data | Backup button, `navigator.storage.persist()`, install to home screen |
| Camera on iPhone | May re-ask for permission when reopened | Test on mom's actual phone, keep the system camera fallback |
| Very specific items | e.g. cannot tell charger cable brands apart | Add a short text when saving |

## 9. Ideas Parked for Later

- **Document expansion:** have an LLM expand short text into related terms. Not now, because it does not help when mom types nothing and needs a heavy on-device LLM or a server. If added later, store the original text separately from the expanded text.
- Voice search / spoken answers, family sharing (needs a server), wrapping in Capacitor as a native app if web limits get in the way.

## 10. Plan

1. **Single-file prototype:** camera + save + search with jina-clip-v2 + IndexedDB storage.
2. **Real-world test:** photograph 20-30 household items and try three kinds of queries:
   - Exact name (e.g. "scissors")
   - Different name (e.g. "paper cutter")
   - By use (e.g. "things for a power outage")
3. **Decide:** if accuracy is good, continue (UI from section 4, backup button, PWA). If not, adjust how photos are taken, add text, or change the model.
4. **Let mom use it** for about 2 weeks, see where she gets stuck, then refine.

## 11. Still To Verify

- [ ] Actual file size of jina-clip-v2 (Files tab) and whether it runs on mom's phone
- [ ] How to call it in Transformers.js, per the model card
- [ ] Thai search accuracy on real items
- [ ] Whether mom's phone is Android or iPhone (affects camera and PWA install)