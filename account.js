import { connectFirebase, profileUrl, accountError, tagIdFromPath } from "./firebase-client.js";

const byId = id => document.getElementById(id);
const form = byId("account-form");
const status = byId("status");
const verify = byId("verify");
const params = new URLSearchParams(location.search);
const mode = params.get("mode");
const tag = tagIdFromPath(params.get("next") || "");
const destination = tag ? "/p/" + tag : profileUrl;

if (tag) {
    for (const id of ["login-tab", "register-tab", "reset-link"]) {
        const link = byId(id);
        const url = new URL(link.href);
        url.searchParams.set("next", destination);
        link.href = url.href;
    }
}
const register = mode === "register";
const reset = mode === "reset";
const title = register ? "Sign In" : reset ? "Reset password" : "Login";
byId("account-title").textContent = title;
byId("account-submit").textContent = reset ? "Kirim tautan reset" : title;
byId("username-field").hidden = !register;
byId("dob-field").hidden = !register;
byId("password-field").hidden = reset;
byId("confirm-password-field").hidden = !register;
byId("google").hidden = register || reset;
byId("reset-link").hidden = register || reset;
if (!reset) byId(register ? "register-tab" : "login-tab").setAttribute("aria-current", "page");
const { username, email, password, confirmPassword, dob } = form.elements;
username.required = dob.required = confirmPassword.required = register;
password.required = !reset;
password.minLength = register ? 6 : 0;
password.autocomplete = register ? "new-password" : "current-password";
const today = new Date();
dob.max = new Date(today - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

async function start() {
    const { auth, identity, database, db } = await connectFirebase();
    await auth.authStateReady();

    function run(action) {
        return async (event) => {
            event.preventDefault();
            const controls = document.querySelectorAll("button");
            controls.forEach(button => button.disabled = true);
            status.textContent = "";
            try {
                await action();
            } catch (error) {
                status.textContent = accountError(error);
            } finally {
                controls.forEach(button => button.disabled = false);
            }
        };
    }

    function showVerification(message) {
        form.hidden = true;
        verify.hidden = false;
        status.textContent = message;
    }

    async function next(user) {
        await user.reload();
        if (auth.currentUser?.emailVerified) {
            await auth.currentUser.getIdToken(true);
            location.replace(destination);
        } else {
            showVerification("Verifikasi email untuk membuka profil.");
        }
    }

    form.addEventListener("submit", run(async () => {
        const address = email.value.trim();
        if (reset) {
            try {
                await identity.sendPasswordResetEmail(auth, address);
            } catch (error) {
                if (error.code !== "auth/user-not-found") throw error;
            }
            status.textContent = "Jika email terdaftar, tautan reset akan dikirim.";
            return;
        }

        if (register) {
            if (password.value !== confirmPassword.value) {
                status.textContent = "Konfirmasi password harus sama dengan password.";
                confirmPassword.focus();
                return;
            }
            const name = username.value.trim();
            if (!name) {
                status.textContent = "Isi username.";
                return;
            }
            const { user } = await identity.createUserWithEmailAndPassword(auth, address, password.value);
            // Save registration details before sending the verification email.
            try {
                await database.setDoc(database.doc(db, "registrations", user.uid), {
                    name, dob: dob.value
                });
            } catch (error) {
                try {
                    await identity.deleteUser(user);
                } catch {
                    showVerification("Akun dibuat. Simpan ulang data pendaftaran dengan melengkapi profil setelah verifikasi.");
                }
                throw error;
            }
            showVerification("Periksa email untuk tautan verifikasi.");
            await identity.sendEmailVerification(user);
            return;
        }

        const { user } = await identity.signInWithEmailAndPassword(auth, address, password.value);
        await next(user);
    }));
    byId("google").addEventListener("click", run(async () => {
        const { user } = await identity.signInWithPopup(auth, new identity.GoogleAuthProvider());
        await next(user);
    }));
    byId("confirm-email").addEventListener("click", run(() => next(auth.currentUser)));
    byId("resend").addEventListener("click", run(async () => {
        await identity.sendEmailVerification(auth.currentUser);
        status.textContent = "Email verifikasi dikirim ulang.";
    }));
    byId("switch-account").addEventListener("click", run(async () => {
        await identity.signOut(auth);
        location.replace(tag ? "account.html?next=" + encodeURIComponent(destination) : "account.html");
    }));

    if (auth.currentUser && !reset) {
        await next(auth.currentUser);
    } else {
        byId("account-submit").disabled = false;
        byId("google").disabled = false;
    }
}

if (location.hostname === "127.0.0.1") {
    const localUrl = new URL(location.href);
    localUrl.hostname = "localhost";
    location.replace(localUrl.href);
} else {
    start().catch(error => {
        status.textContent = error.code ? accountError(error) : error.message;
    });
}

