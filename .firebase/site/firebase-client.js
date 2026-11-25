import { firebaseConfig } from "./firebase-config.js";

export const profileUrl = "profile.html?mode=account";

export async function connectFirebase() {
    if (Object.values(firebaseConfig).some(value => !value)) {
        throw new Error("Akun TapIN belum terhubung ke Firebase. Demo profil bisa langsung dibuka.");
    }

    const base = "https://www.gstatic.com/firebasejs/10.14.1";
    const [appSdk, identity, database] = await Promise.all([
        import(base + "/firebase-app.js"),
        import(base + "/firebase-auth.js"),
        import(base + "/firebase-firestore.js")
    ]);
    const app = appSdk.initializeApp(firebaseConfig);
    const auth = identity.getAuth(app);
    auth.languageCode = "id";
    return { auth, identity, database, db: database.getFirestore(app) };
}

export function accountError(error) {
    if (error.code === "auth/unauthorized-domain" && location.hostname === "127.0.0.1") {
        const localUrl = new URL(location.href);
        localUrl.hostname = "localhost";
        return "Buka " + localUrl.href + " untuk login dengan Google. Firebase belum mengizinkan 127.0.0.1.";
    }
    return ({
        "auth/operation-not-allowed": "Metode login ini belum diaktifkan. Cek Authentication → Sign-in method di Firebase Console.",
        "auth/email-already-in-use": "Email sudah terdaftar. Silakan masuk atau reset password.",
        "auth/invalid-credential": "Email atau password salah.",
        "auth/weak-password": "Password belum memenuhi persyaratan.",
        "auth/popup-closed-by-user": "Jendela login Google tertutup sebelum login selesai.",
        "auth/popup-blocked": "Izinkan pop-up untuk masuk dengan Google.",
        "auth/unauthorized-domain": "Domain ini belum diizinkan di Firebase Authentication.",
        "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi nanti.",
        "auth/network-request-failed": "Koneksi terputus. Coba lagi.",
        "permission-denied": "Akses data ditolak. Periksa konfigurasi Firestore dan status verifikasi email."
    })[error.code] || "Terjadi kendala saat memproses permintaan. Coba lagi.";
}



export function tagIdFromPath(path) {
    return path.match(/^\/p\/([A-Za-z0-9_-]{1,64})\/?$/)?.[1];
}
