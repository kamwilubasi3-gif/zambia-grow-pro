export const ZAMBIA_LOCATIONS: Record<string, string[]> = {
  "Central": ["Chibombo", "Kabwe", "Kapiri Mposhi", "Mkushi", "Mumbwa", "Serenje", "Ngabwe", "Luano", "Chisamba", "Chitambo", "Shibuyunji"],
  "Copperbelt": ["Kitwe", "Ndola", "Mufulira", "Luanshya", "Chingola", "Kalulushi", "Lufwanyama", "Masaiti", "Mpongwe", "Chililabombwe"],
  "Eastern": ["Chipata", "Katete", "Petauke", "Lundazi", "Chadiza", "Mambwe", "Nyimba", "Sinda", "Vubwi", "Kasenengwa"],
  "Luapula": ["Mansa", "Nchelenge", "Samfya", "Kawambwa", "Mwense", "Milenge", "Chembe", "Chipili", "Lunga", "Mwansabombwe"],
  "Lusaka": ["Lusaka", "Kafue", "Chongwe", "Luangwa", "Chilanga", "Chirundu", "Rufunsa"],
  "Muchinga": ["Chinsali", "Mpika", "Nakonde", "Isoka", "Mafinga", "Shiwang'andu", "Kanchibiya", "Lavushimanda"],
  "Northern": ["Kasama", "Mbala", "Mpulungu", "Mungwi", "Luwingu", "Kaputa", "Nsama", "Lupososhi", "Mporokoso", "Chilubi", "Lunte", "Senga Hill"],
  "North-Western": ["Solwezi", "Kasempa", "Mwinilunga", "Zambezi", "Kabompo", "Chavuma", "Ikelenge", "Kalumbila", "Manyinga", "Mushindamo"],
  "Southern": ["Livingstone", "Choma", "Mazabuka", "Monze", "Kalomo", "Namwala", "Siavonga", "Sinazongwe", "Kazungula", "Gwembe", "Pemba", "Zimba"],
  "Western": ["Mongu", "Senanga", "Kaoma", "Sesheke", "Kalabo", "Shangombo", "Lukulu", "Mulobezi", "Limulunga", "Nalolo", "Sikongo", "Mwandi", "Nkeyema", "Mitete", "Sioma"],
};

export const ZAMBIA_CROPS: Record<string, string[]> = {
  "Central": ["Maize", "Cotton", "Sorghum", "Groundnuts", "Soybeans", "Sunflower", "Sweet Potatoes", "Tobacco"],
  "Copperbelt": ["Maize", "Cassava", "Sweet Potatoes", "Vegetables", "Beans", "Groundnuts"],
  "Eastern": ["Maize", "Cotton", "Groundnuts", "Sunflower", "Soybeans", "Rice", "Tobacco", "Sorghum"],
  "Luapula": ["Cassava", "Rice", "Maize", "Groundnuts", "Beans", "Sweet Potatoes", "Fish Farming"],
  "Lusaka": ["Maize", "Vegetables", "Wheat", "Soybeans", "Groundnuts", "Sweet Potatoes", "Poultry"],
  "Muchinga": ["Maize", "Cassava", "Beans", "Groundnuts", "Finger Millet", "Rice"],
  "Northern": ["Cassava", "Finger Millet", "Beans", "Maize", "Rice", "Groundnuts"],
  "North-Western": ["Cassava", "Maize", "Pineapple", "Rice", "Beans", "Honey"],
  "Southern": ["Maize", "Cotton", "Tobacco", "Sunflower", "Groundnuts", "Cattle Ranching", "Sorghum", "Wheat"],
  "Western": ["Rice", "Cassava", "Maize", "Cattle Ranching", "Timber", "Honey"],
};

export interface LocationData {
  province: string;
  district: string;
}

export interface CropData {
  name: string;
  isCustom?: boolean;
}
