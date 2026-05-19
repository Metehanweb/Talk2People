

export const baseSchemaFields = {
    ad: { type: String, required: true },
    kisa_ad: { type: String, index: true, default: null },
    aciklama: { type: String, default: null },
    etiketler: { type: [String], default: [] },
    aktif_mi: { type: Boolean, default: true },
    silindi_mi: { type: Boolean, default: false },
};

export const baseSchemaOptions = {
    timestamps: {
        createdAt: 'olusturulma_tarihi',
        updatedAt: 'degistirilme_tarihi',
    },
    toJSON: {
        transform: (doc, ret) => {
            delete ret.__v;
            return ret;
        },
    },
};
