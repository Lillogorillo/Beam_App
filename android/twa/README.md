# TWA quickstart for beam-app-phi.vercel.app

1) npm i -g @bubblewrap/cli
2) bubblewrap init --manifest=https://beam-app-phi.vercel.app/manifest.json --directory android/twa
3) cd android/twa && bubblewrap build
4) (opzionale) bubblewrap install per debug su device

Sostituisci SHA256 in public/.well-known/assetlinks.json con l’impronta del keystore generato da bubblewrap (file app/build.gradle.kts o output init).
