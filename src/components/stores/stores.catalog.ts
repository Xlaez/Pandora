import { StoreItemCategory } from './inventory-item.entity';

export interface StoreCatalogItem {
    sku: string;
    name: string;
    description: string;
    price: number;
    category: StoreItemCategory;
    icon: string;
    grantsHatStyle?: string;
    grantsAvatarColor?: string;
}

export interface PandoraStoreDefinition {
    slug: string;
    name: string;
    subtitle: string;
    district: string;
    address: string;
    posX: number;
    posZ: number;
    rotationY: number;
    facadeColor: string;
    accentColor: string;
    signText: string;
    items: StoreCatalogItem[];
}

export const PANDORA_STORES: PandoraStoreDefinition[] = [
    {
        slug: 'harrods-emporium',
        name: 'Harrods & Co. Emporium',
        subtitle: 'Luxury Department Store & Royal Goods',
        district: 'Knightsbridge Plaza',
        address: '87 Brompton High Street, SW1X',
        posX: -14,
        posZ: -12,
        rotationY: 0,
        facadeColor: '#1B4332',
        accentColor: '#E5B84B',
        signText: 'HARRODS & CO.',
        items: [
            {
                sku: 'royal-top-hat',
                name: 'Ascot Silk Top Hat',
                description: 'Hand-blockedMayfair black silk top hat worn by Pandora nobility.',
                price: 1800,
                category: 'apparel',
                icon: 'crown',
                grantsHatStyle: 'tophat',
            },
            {
                sku: 'sovereign-gold-crown',
                name: 'Sovereign Jubilee Crown',
                description: '24-karat gilded ceremonial crown crafted for Pandora estate moguls.',
                price: 6500,
                category: 'apparel',
                icon: 'sparkles',
                grantsHatStyle: 'crown',
            },
            {
                sku: 'mayfair-chronograph',
                name: 'Bond Street Chronograph',
                description: 'Precision mechanical timepiece with sapphire glass and gold bezel.',
                price: 3200,
                category: 'gadget',
                icon: 'watch',
            },
            {
                sku: 'georgian-chandelier-set',
                name: 'Crystal Drawing-Room Chandelier',
                description: 'Collector piece for your Pandora townhouse interior.',
                price: 2400,
                category: 'decor',
                icon: 'lamp',
            },
        ],
    },
    {
        slug: 'savile-row-tailor',
        name: 'Savile Row Bespoke Tailor',
        subtitle: 'Fine British Tailoring & Haberdashery',
        district: 'Mayfair Cross',
        address: '12 Savile Row, W1S',
        posX: 14,
        posZ: -12,
        rotationY: 0,
        facadeColor: '#1E293B',
        accentColor: '#D4AF37',
        signText: 'SAVILE ROW TAILORS',
        items: [
            {
                sku: 'city-bowler-hat',
                name: 'Threadneedle Street Bowler',
                description: 'Classic wool-felt London financier bowler hat.',
                price: 950,
                category: 'apparel',
                icon: 'hat',
                grantsHatStyle: 'bowler',
            },
            {
                sku: 'crimson-guard-coat',
                name: 'Buckingham Crimson Overcoat',
                description: 'Tailored scarlet wool coat with brass buttons.',
                price: 2100,
                category: 'apparel',
                icon: 'shirt',
                grantsAvatarColor: '#C0392B',
            },
            {
                sku: 'emerald-kensington-suit',
                name: 'Kensington Emerald Tweed',
                description: 'Bespoke British racing green three-piece suit.',
                price: 2300,
                category: 'apparel',
                icon: 'shirt',
                grantsAvatarColor: '#1E8449',
            },
            {
                sku: 'royal-navy-trench',
                name: 'Westminster Navy Trench',
                description: 'Weatherproof double-breasted gabardine trench coat.',
                price: 1950,
                category: 'apparel',
                icon: 'shirt',
                grantsAvatarColor: '#2471A3',
            },
        ],
    },
    {
        slug: 'fortnum-grocer',
        name: 'Fortnum & Metro Grocer',
        subtitle: 'Artisanal Provisions, Tea & Daily Essentials',
        district: 'Piccadilly South',
        address: '181 Piccadilly Walk, W1A',
        posX: -14,
        posZ: 12,
        rotationY: Math.PI,
        facadeColor: '#2A6F62',
        accentColor: '#F4E3B2',
        signText: 'FORTNUM GROCER',
        items: [
            {
                sku: 'earl-grey-caddy',
                name: 'Royal Blend Earl Grey Caddy',
                description: 'Aromatic bergamot loose-leaf tea in a signature eau-de-nil tin.',
                price: 180,
                category: 'refreshment',
                icon: 'coffee',
            },
            {
                sku: 'piccadilly-hamper',
                name: 'Wicker Picnic Hamper',
                description: 'Packed with artisanal cheeses, preserves, and shortbread.',
                price: 650,
                category: 'refreshment',
                icon: 'shopping-bag',
            },
            {
                sku: 'pandora-5g-pro',
                name: 'PandoraPhone Pro Satellite Case',
                description: 'Gold-trimmed protective titanium shell for your Pandora cell phone.',
                price: 1100,
                category: 'gadget',
                icon: 'smartphone',
            },
            {
                sku: 'botanical-bonsai',
                name: 'Kew Gardens Conservatory Fern',
                description: 'Lush indoor botanical specimen for your residence.',
                price: 420,
                category: 'decor',
                icon: 'flower',
            },
        ],
    },
    {
        slug: 'crown-anchor-pub',
        name: 'The Crown & Anchor Tavern',
        subtitle: 'Historic Public House & Social Parlour',
        district: 'Covent Garden East',
        address: '29 Neal Street, WC2H',
        posX: 14,
        posZ: 12,
        rotationY: Math.PI,
        facadeColor: '#5D2A18',
        accentColor: '#F5B041',
        signText: 'CROWN & ANCHOR PUB',
        items: [
            {
                sku: 'thames-amber-ale',
                name: 'Thames Sovereign Amber Pint',
                description: 'Freshly poured cask ale brewed in Southwark.',
                price: 95,
                category: 'refreshment',
                icon: 'beer',
            },
            {
                sku: 'mayfair-fish-chips',
                name: 'Golden Cod & Triple-Cooked Chips',
                description: 'Served hot with minted mushy peas and malt vinegar.',
                price: 220,
                category: 'refreshment',
                icon: 'utensils',
            },
            {
                sku: 'beefeater-cap',
                name: 'Tower Guard Flat Cap',
                description: 'Classic houndstooth newsboy cap popular in East London.',
                price: 780,
                category: 'apparel',
                icon: 'hat',
                grantsHatStyle: 'cap',
            },
            {
                sku: 'sovereign-gold-coat',
                name: 'Gilded Financier Velvet Coat',
                description: 'Warm amber-gold tailored evening coat.',
                price: 2800,
                category: 'apparel',
                icon: 'shirt',
                grantsAvatarColor: '#D4AC0D',
            },
        ],
    },
];

