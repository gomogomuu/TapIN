import { connectFirebase, accountError } from "./firebase-client.js";

const types = {
    instagram: { label: "Instagram", hint: "@username atau URL", host: "instagram.com", prefix: "https://www.instagram.com/" },
    whatsapp: { label: "WhatsApp", hint: "+628123456789 atau URL wa.me", host: "wa.me", prefix: "https://wa.me/" },
    tiktok: { label: "TikTok", hint: "@username atau URL", host: "tiktok.com", prefix: "https://www.tiktok.com/@" },
    website: { label: "Website", hint: "https://contoh.com" },
    other: { label: "Lainnya", hint: "https://contoh.com" }
};

function readLink(row) {
    const kind = row.querySelector("select").value;
    const type = types[kind];
    const label = row.querySelector('[name="label"]').value.trim();
    let address = row.querySelector('[name="address"]').value.trim();
    if (type.prefix && !address.includes("://")) {
        address = kind === "whatsapp" ? address.replace(/[+\s()-]/g, "") : address.replace(/^@/, "");
        const valid = kind === "whatsapp" ? /^[1-9]\d{6,14}$/.test(address) : /^[\w.]+$/.test(address);
        if (valid) address = type.prefix + address;
    }

    let url;
    try {
        url = new URL(address);
    } catch {
        throw new Error(`Isi alamat ${type.label} sesuai contoh.`);
    }
    const matchesHost = !type.host || url.hostname === type.host || url.hostname.endsWith("." + type.host);
    if (!["https:", "http:"].includes(url.protocol) || !matchesHost || url.username || url.password) {
        throw new Error(`Periksa alamat ${type.label}.`);
    }
    if (kind === "whatsapp" && !/^\/[1-9]\d{6,14}\/?$/.test(url.pathname)) {
        throw new Error("Gunakan nomor WhatsApp dengan kode negara, misalnya +628123456789.");
    }
    return { kind, label, name: label || type.label, url: url.href };
}

async function resizePhoto(file, maxSide) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15 * 1024 * 1024) {
        throw new Error("Pilih foto JPG, PNG, atau WebP dengan ukuran maksimal 15 MB.");
    }
    const bitmap = await createImageBitmap(file).catch(() => {
        throw new Error("Foto tidak dapat dibaca.");
    });
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const data = canvas.toDataURL("image/jpeg", 0.75);
    if (data.length > 400000) throw new Error("Foto terlalu besar setelah dikompresi. Pilih foto yang lebih kecil.");
    return data;
}

export async function startProfile(renderProfile, tagId) {
    const loginUrl = tagId ? "/account.html?next=" + encodeURIComponent("/p/" + tagId) : "/account.html";
    const { auth, identity, database, db } = await connectFirebase();
    await auth.authStateReady();
    if (!tagId) await auth.currentUser?.reload();
    const user = auth.currentUser;
    if (!tagId && !user?.emailVerified) {
        location.replace(loginUrl);
        return;
    }
    if (!tagId) await user.getIdToken(true);

    const byId = id => document.getElementById(id);
    const profileStatus = byId("profile-status");
    let savedNoticeTimer;

    byId("logout").addEventListener("click", async () => {
        try {
            await identity.signOut(auth);
            location.replace(tagId ? "/p/" + tagId : loginUrl);
        } catch (error) {
            clearTimeout(savedNoticeTimer);
            profileStatus.textContent = accountError(error);
        }
    });
    byId("edit-profile").hidden = true;
    byId("profile-actions").hidden = !user;
    const login = byId("profile-login");
    login.href = loginUrl;
    login.hidden = Boolean(user);

    const binding = tagId && await database.getDoc(database.doc(db, "tags", tagId));
    const ownerUid = tagId ? binding.data()?.ownerUid : user.uid;
    if (!ownerUid) {
        byId("profileName").textContent = "Tag belum terhubung";
        byId("profileBio").textContent = "Tag " + tagId
            + " belum dipasangkan ke profil. Hubungi admin TapIN untuk memasangkannya.";
        return;
    }

    const owner = user?.emailVerified && ownerUid === user.uid;
    const ref = database.doc(db, "profiles", ownerUid);
    const saved = await database.getDoc(ref).catch(error => {
        if (!owner && error.code === "permission-denied") return null;
        throw error;
    });
    const details = saved?.data();
    if (!owner) {
        if (!details || details.tagId !== tagId) {
            byId("profileName").textContent = "Profil belum tersedia";
            return;
        }
        renderProfile(details);
        return;
    }

    const registration = details?.name ? null
        : await database.getDoc(database.doc(db, "registrations", user.uid));
    let profile = {
        name: registration?.data()?.name || (user.displayName || "Profil saya").slice(0, 40),
        image: "",
        backgroundImage: "",
        links: [],
        ...details
    };
    renderProfile(profile);

    const editor = byId("profile-editor");
    const form = byId("profile-form");
    const fields = byId("link-fields");
    const status = byId("edit-status");
    const add = byId("add-link");

    function addRow(link = {}) {
        const row = byId("link-template").content.firstElementChild.cloneNode(true);
        const kind = row.querySelector("select");
        const address = row.querySelector('[name="address"]');
        for (const [value, type] of Object.entries(types)) {
            kind.add(new Option(type.label, value));
        }
        kind.value = Object.hasOwn(types, link.kind) ? link.kind : "other";
        const updateHint = () => { address.placeholder = types[kind.value].hint; };
        kind.addEventListener("change", updateHint);
        updateHint();
        address.value = link.url || "";
        row.querySelector('[name="label"]').value = link.label ?? link.name ?? "";
        row.querySelector("button").addEventListener("click", () => {
            row.remove();
            add.disabled = false;
            add.focus();
        });
        fields.append(row);
        add.disabled = fields.children.length >= 20;
        return kind;
    }

    byId("edit-profile").addEventListener("click", () => {
        form.reset();
        status.textContent = "";
        form.elements.username.value = profile.name;
        fields.replaceChildren();
        add.disabled = false;
        profile.links.forEach(addRow);
        editor.showModal();
    });
    add.addEventListener("click", () => addRow().focus());
    byId("cancel-edit").addEventListener("click", () => editor.close());

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const controls = [...form.elements].filter(control => !control.disabled);
        const name = form.elements.username.value.trim();
        if (!name) {
            status.textContent = "Isi username.";
            return;
        }
        const avatar = form.elements.avatar.files[0];
        const background = form.elements.background.files[0];
        controls.forEach(control => control.disabled = true);
        const preventClose = event => event.preventDefault();
        editor.addEventListener("cancel", preventClose);
        status.textContent = "Menyimpan…";
        try {
            const links = [...fields.children].map(readLink);
            const changes = { name, links };
            const [image, backgroundImage] = await Promise.all([
                avatar && resizePhoto(avatar, 400),
                background && resizePhoto(background, 1400)
            ]);
            if (image) changes.image = image;
            if (backgroundImage) changes.backgroundImage = backgroundImage;
            await database.setDoc(ref, changes, { merge: true });
            profile = { ...profile, ...changes };
            renderProfile(profile);
            editor.close();
            clearTimeout(savedNoticeTimer);
            profileStatus.textContent = "Profil tersimpan.";
            savedNoticeTimer = setTimeout(() => {
                profileStatus.textContent = "";
            }, 3000);
        } catch (error) {
            status.textContent = error.code ? accountError(error) : error.message;
        } finally {
            controls.forEach(control => control.disabled = false);
            editor.removeEventListener("cancel", preventClose);
        }
    });
    byId("edit-profile").hidden = false;
}




