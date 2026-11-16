/* Word library: the owner's English ↔ Spanish word list. It builds the Spanish name of an item from its English description so the
   online store can show it to Spanish-speaking visitors. It knows a little Spanish grammar: the thing comes first and what describes it
   follows ("blue dress" → "vestido azul"), colours agree with the thing ("red dresses" → "vestidos rojos"), materials become "de lino",
   and phrases like "long sleeve" become "de manga larga". Pure rules, tested in Node. Nothing here touches costs or profit. */
(function (root) {
  const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/[“”"'’]/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  const clean = (tok) => tok.replace(/^[^\p{L}\p{N}&]+|[^\p{L}\p{N}&]+$/gu, '');
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  // ---- the starter list ----------------------------------------------------------------------------------------------------------
  // t: n thing (g = m/f, pl = always plural), a describing word (inv 'all' = never changes), m material ("de lino"), p phrase that goes
  // after the thing ("de manga larga"), c connector ("y"), l literal (sizes, codes), x plain (stays where it is typed).
  const N = (c, rows) => rows.map(([en, es, g, pl, pe]) => Object.assign({ en, es, c, t: 'n', g }, pl ? { pl: true } : {}, pe ? { pe } : {}));
  const A = (c, rows) => rows.map(([en, es, inv]) => (inv ? { en, es, c, t: 'a', inv } : { en, es, c, t: 'a' }));
  const T = (t) => (c, rows) => rows.map(([en, es]) => ({ en, es, c, t }));
  const M = T('m'), P = T('p'), C = T('c'), L = T('l'), X = T('x');
  const STARTER = [].concat(
    N('clothes', [['denim jumper', 'braga', 'f', 0, 'bragas'], ['jean jumper', 'braga', 'f', 0, 'bragas']]),
    N('clothes', [['top', 'blusa', 'f'], ['blouse', 'blusa', 'f'], ['shirt', 'camisa', 'f'], ['t-shirt', 'camiseta', 'f'], ['tee', 'camiseta', 'f'], ['tank top', 'camiseta sin mangas', 'f'], ['crop top', 'crop top', 'm', 0, 'crop tops'],
      ['bodysuit', 'body', 'm', 0, 'bodys'], ['sweater', 'suéter', 'm'], ['sweatshirt', 'sudadera', 'f'], ['hoodie', 'sudadera con capucha', 'f'], ['cardigan', 'cárdigan', 'm', 0, 'cárdigans'], ['jacket', 'chaqueta', 'f'], ['blazer', 'blazer', 'm', 0, 'blazers'],
      ['coat', 'abrigo', 'm'], ['vest', 'chaleco', 'm'], ['dress', 'vestido', 'm'], ['gown', 'vestido', 'm'], ['maxi dress', 'vestido largo', 'm'], ['mini dress', 'vestido corto', 'm'], ['midi dress', 'vestido midi', 'm'],
      ['wrap dress', 'vestido cruzado', 'm'], ['bodycon dress', 'vestido ajustado', 'm'], ['skirt', 'falda', 'f'], ['pants', 'pantalones', 'm', 1], ['trousers', 'pantalones', 'm', 1], ['jeans', 'jeans', 'm', 1],
      ['leggings', 'leggings', 'f', 1], ['shorts', 'shorts', 'm', 1], ['joggers', 'pantalones deportivos', 'm', 1], ['track pants', 'pantalones deportivos', 'm', 1], ['trackpants', 'pantalones deportivos', 'm', 1], ['sweatpants', 'pantalones deportivos', 'm', 1], ['sweat pants', 'pantalones deportivos', 'm', 1], ['jogger pants', 'pantalones deportivos', 'm', 1], ['cargo pants', 'pantalones cargo', 'm', 1], ['palazzo pants', 'pantalones palazzo', 'm', 1], ['yoga pants', 'pantalones de yoga', 'm', 1], ['dress pants', 'pantalones de vestir', 'm', 1], ['biker shorts', 'licras cortas', 'f', 1], ['track jacket', 'chaqueta deportiva', 'f'], ['jumpsuit', 'enterizo', 'm'], ['romper', 'mono', 'm'], ['overalls', 'overol', 'm'],
      ['set', 'conjunto', 'm'], ['tracksuit', 'conjunto deportivo', 'm'], ['pajamas', 'pijama', 'm'], ['robe', 'bata', 'f'], ['swimsuit', 'traje de baño', 'm'], ['bikini', 'bikini', 'm'], ['lingerie', 'lencería', 'f'],
      ['bra', 'sostén', 'm'], ['underwear', 'ropa interior', 'f'], ['socks', 'calcetines', 'm', 1], ['tights', 'medias', 'f', 1], ['scarf', 'bufanda', 'f'], ['hat', 'sombrero', 'm'], ['cap', 'gorra', 'f'], ['belt', 'cinturón', 'm'], ['gloves', 'guantes', 'm', 1]]),
    N('shoes', [['shoes', 'zapatos', 'm', 1], ['sandals', 'sandalias', 'f', 1], ['sneakers', 'tenis', 'm', 1], ['boots', 'botas', 'f', 1], ['heels', 'tacones', 'm', 1], ['flats', 'zapatos planos', 'm', 1], ['slippers', 'pantuflas', 'f', 1],
      ['slides', 'chancletas', 'f', 1], ['bag', 'cartera', 'f'], ['handbag', 'cartera', 'f'], ['purse', 'cartera', 'f'], ['backpack', 'mochila', 'f'], ['wallet', 'billetera', 'f'], ['clutch', 'clutch', 'm', 0, 'clutches'], ['tote bag', 'bolso tote', 'm'],
      ['sunglasses', 'lentes de sol', 'm', 1], ['watch', 'reloj', 'm'], ['ring', 'anillo', 'm'], ['necklace', 'collar', 'm'], ['earrings', 'aretes', 'm', 1], ['bracelet', 'pulsera', 'f'], ['anklet', 'tobillera', 'f'], ['perfume', 'perfume', 'm']]),
    A('colours', [['black', 'negro'], ['white', 'blanco'], ['red', 'rojo'], ['blue', 'azul'], ['green', 'verde'], ['yellow', 'amarillo'], ['orange', 'anaranjado'], ['purple', 'morado'], ['pink', 'rosado'], ['brown', 'marrón'],
      ['grey', 'gris'], ['gray', 'gris'], ['beige', 'beige'], ['gold', 'dorado'], ['silver', 'plateado'], ['sky blue', 'celeste'], ['baby blue', 'celeste'], ['cream', 'crema', 'all'], ['ivory', 'marfil', 'all'],
      ['navy', 'azul marino', 'all'], ['navy blue', 'azul marino', 'all'], ['light blue', 'azul claro', 'all'], ['dark blue', 'azul oscuro', 'all'], ['royal blue', 'azul rey', 'all'], ['light pink', 'rosado claro', 'all'],
      ['hot pink', 'fucsia', 'all'], ['fuchsia', 'fucsia', 'all'], ['magenta', 'magenta', 'all'], ['light green', 'verde claro', 'all'], ['dark green', 'verde oscuro', 'all'], ['olive', 'verde oliva', 'all'], ['olive green', 'verde oliva', 'all'], ['army green', 'verde militar', 'all'], ['forest green', 'verde bosque', 'all'], ['emerald', 'esmeralda', 'all'], ['lime', 'lima', 'all'], ['sage', 'verde salvia', 'all'], ['mint', 'menta', 'all'],
      ['teal', 'verde azulado', 'all'], ['turquoise', 'turquesa', 'all'], ['aqua', 'aqua', 'all'], ['lavender', 'lavanda', 'all'], ['lilac', 'lila', 'all'], ['coral', 'coral', 'all'], ['peach', 'durazno', 'all'], ['salmon', 'salmón', 'all'],
      ['burgundy', 'vinotinto', 'all'], ['maroon', 'vinotinto', 'all'], ['wine', 'vino', 'all'], ['mustard', 'mostaza', 'all'], ['khaki', 'caqui', 'all'], ['tan', 'beige', 'all'], ['nude', 'nude', 'all'], ['champagne', 'champán', 'all'],
      ['rose gold', 'oro rosado', 'all'], ['copper', 'cobre', 'all'], ['bronze', 'bronce', 'all'], ['charcoal', 'gris oscuro', 'all'], ['off white', 'blanco hueso', 'all'], ['rust', 'óxido', 'all'], ['neon', 'neón', 'all'],
      ['multicolor', 'multicolor'], ['colorful', 'colorido'], ['transparent', 'transparente'], ['clear', 'transparente']]),
    A('styles', [['floral', 'floral'], ['striped', 'rayado'], ['printed', 'estampado'], ['solid', 'liso'], ['plain', 'liso'], ['embroidered', 'bordado'], ['pleated', 'plisado'], ['ribbed', 'acanalado'], ['halter', 'halter', 'all'],
      ['slim fit', 'ajustado'], ['fitted', 'ajustado'], ['oversized', 'oversize', 'all'], ['loose', 'holgado'], ['stretch', 'elástico'], ['cropped', 'corto'], ['maxi', 'largo'], ['midi', 'midi', 'all'], ['mini', 'mini', 'all'],
      ['long', 'largo'], ['short', 'corto'], ['casual', 'casual'], ['elegant', 'elegante'], ['formal', 'formal'], ['sexy', 'sexy', 'all'], ['cute', 'bonito'], ['sporty', 'deportivo'], ['vintage', 'vintage', 'all'], ['boho', 'boho', 'all'],
      ['tropical', 'tropical'], ['bear', 'oso', 'all'], ['teddy bear', 'osito', 'all'], ['puppy', 'perrito', 'all'],
      // things that are printed on a T-shirt (animals, fruit, flowers, shapes): they describe the thing, so "franela león" is a lion t-shirt
      ['lion', 'león', 'all'], ['tiger', 'tigre', 'all'], ['leopard', 'leopardo', 'all'], ['cheetah', 'guepardo', 'all'], ['panther', 'pantera', 'all'], ['zebra', 'cebra', 'all'], ['giraffe', 'jirafa', 'all'], ['elephant', 'elefante', 'all'], ['gorilla', 'gorila', 'all'], ['panda', 'panda', 'all'], ['koala', 'koala', 'all'], ['kangaroo', 'canguro', 'all'], ['hippo', 'hipopótamo', 'all'], ['rhino', 'rinoceronte', 'all'], ['wolf', 'lobo', 'all'], ['fox', 'zorro', 'all'], ['deer', 'ciervo', 'all'], ['reindeer', 'reno', 'all'], ['bunny', 'conejito', 'all'], ['rabbit', 'conejo', 'all'], ['mouse', 'ratón', 'all'], ['cat', 'gato', 'all'], ['kitten', 'gatito', 'all'], ['kitty', 'gatita', 'all'], ['dog', 'perro', 'all'], ['horse', 'caballo', 'all'], ['pony', 'poni', 'all'], ['unicorn', 'unicornio', 'all'], ['cow', 'vaca', 'all'], ['pig', 'cerdo', 'all'], ['piglet', 'cerdito', 'all'], ['sheep', 'oveja', 'all'], ['lamb', 'cordero', 'all'], ['goat', 'cabra', 'all'], ['duck', 'pato', 'all'], ['duckling', 'patito', 'all'], ['chicken', 'pollo', 'all'], ['chick', 'pollito', 'all'], ['rooster', 'gallo', 'all'], ['owl', 'búho', 'all'], ['eagle', 'águila', 'all'], ['parrot', 'loro', 'all'], ['flamingo', 'flamenco', 'all'], ['peacock', 'pavo real', 'all'], ['swan', 'cisne', 'all'], ['penguin', 'pingüino', 'all'], ['butterfly', 'mariposa', 'all'], ['bee', 'abeja', 'all'], ['ladybug', 'mariquita', 'all'], ['dragonfly', 'libélula', 'all'], ['snake', 'serpiente', 'all'], ['dinosaur', 'dinosaurio', 'all'], ['dragon', 'dragón', 'all'], ['turtle', 'tortuga', 'all'], ['frog', 'rana', 'all'], ['crocodile', 'cocodrilo', 'all'], ['alligator', 'caimán', 'all'], ['lizard', 'lagarto', 'all'], ['fish', 'pez', 'all'], ['dolphin', 'delfín', 'all'], ['whale', 'ballena', 'all'], ['shark', 'tiburón', 'all'], ['octopus', 'pulpo', 'all'], ['crab', 'cangrejo', 'all'], ['seahorse', 'caballito de mar', 'all'], ['starfish', 'estrella de mar', 'all'], ['bat', 'murciélago', 'all'], ['spider', 'araña', 'all'], ['snail', 'caracol', 'all'], ['squirrel', 'ardilla', 'all'], ['hedgehog', 'erizo', 'all'], ['raccoon', 'mapache', 'all'], ['sloth', 'perezoso', 'all'], ['alpaca', 'alpaca', 'all'], ['hamster', 'hámster', 'all'], ['polar bear', 'oso polar', 'all'], ['heart', 'corazón', 'all'], ['hearts', 'corazones', 'all'], ['star', 'estrella', 'all'], ['stars', 'estrellas', 'all'], ['moon', 'luna', 'all'], ['sun', 'sol', 'all'], ['rainbow', 'arcoíris', 'all'], ['cloud', 'nube', 'all'], ['flower', 'flor', 'all'], ['flowers', 'flores', 'all'], ['daisy', 'margarita', 'all'], ['sunflower', 'girasol', 'all'], ['tulip', 'tulipán', 'all'], ['cherries', 'cerezas', 'all'], ['strawberry', 'fresa', 'all'], ['apple', 'manzana', 'all'], ['pineapple', 'piña', 'all'], ['watermelon', 'sandía', 'all'], ['avocado', 'aguacate', 'all'], ['cactus', 'cactus', 'all'], ['palm tree', 'palmera', 'all'], ['leaf', 'hoja', 'all'], ['leaves', 'hojas', 'all'], ['tree', 'árbol', 'all'], ['mountain', 'montaña', 'all'], ['anchor', 'ancla', 'all'], ['skull', 'calavera', 'all'], ['crown', 'corona', 'all'], ['lips', 'labios', 'all'],
      // the same things in the plural ("franela fresas" = a strawberries t-shirt)
      ['lions', 'leones', 'all'], ['tigers', 'tigres', 'all'], ['leopards', 'leopardos', 'all'], ['cheetahs', 'guepardos', 'all'], ['panthers', 'panteras', 'all'], ['zebras', 'cebras', 'all'], ['giraffes', 'jirafas', 'all'], ['elephants', 'elefantes', 'all'], ['gorillas', 'gorilas', 'all'], ['kangaroos', 'canguros', 'all'], ['hippos', 'hipopótamos', 'all'], ['rhinos', 'rinocerontes', 'all'], ['wolves', 'lobos', 'all'], ['foxes', 'zorros', 'all'], ['deers', 'ciervos', 'all'], ['reindeers', 'renos', 'all'], ['bunnies', 'conejitos', 'all'], ['rabbits', 'conejos', 'all'], ['mice', 'ratones', 'all'], ['cats', 'gatos', 'all'], ['kittens', 'gatitos', 'all'], ['kitties', 'gatitas', 'all'], ['dogs', 'perros', 'all'], ['horses', 'caballos', 'all'], ['ponies', 'ponis', 'all'], ['unicorns', 'unicornios', 'all'], ['cows', 'vacas', 'all'], ['pigs', 'cerdos', 'all'], ['piglets', 'cerditos', 'all'], ['lambs', 'corderos', 'all'], ['goats', 'cabras', 'all'], ['ducks', 'patos', 'all'], ['ducklings', 'patitos', 'all'], ['chickens', 'pollos', 'all'], ['chicks', 'pollitos', 'all'], ['roosters', 'gallos', 'all'], ['owls', 'búhos', 'all'], ['eagles', 'águilas', 'all'], ['parrots', 'loros', 'all'], ['flamingos', 'flamencos', 'all'], ['swans', 'cisnes', 'all'], ['penguins', 'pingüinos', 'all'], ['butterflies', 'mariposas', 'all'], ['bees', 'abejas', 'all'], ['ladybugs', 'mariquitas', 'all'], ['dragonflies', 'libélulas', 'all'], ['snakes', 'serpientes', 'all'], ['dinosaurs', 'dinosaurios', 'all'], ['dragons', 'dragones', 'all'], ['turtles', 'tortugas', 'all'], ['frogs', 'ranas', 'all'], ['crocodiles', 'cocodrilos', 'all'], ['lizards', 'lagartos', 'all'], ['dolphins', 'delfines', 'all'], ['whales', 'ballenas', 'all'], ['sharks', 'tiburones', 'all'], ['octopuses', 'pulpos', 'all'], ['crabs', 'cangrejos', 'all'], ['bats', 'murciélagos', 'all'], ['spiders', 'arañas', 'all'], ['snails', 'caracoles', 'all'], ['squirrels', 'ardillas', 'all'], ['hedgehogs', 'erizos', 'all'], ['raccoons', 'mapaches', 'all'], ['sloths', 'perezosos', 'all'], ['hamsters', 'hámsteres', 'all'], ['daisies', 'margaritas', 'all'], ['sunflowers', 'girasoles', 'all'], ['tulips', 'tulipanes', 'all'], ['strawberries', 'fresas', 'all'], ['apples', 'manzanas', 'all'], ['pineapples', 'piñas', 'all'], ['watermelons', 'sandías', 'all'], ['avocados', 'aguacates', 'all'], ['anchors', 'anclas', 'all'], ['skulls', 'calaveras', 'all'], ['crowns', 'coronas', 'all'], ['donuts', 'donas', 'all'], ['balloons', 'globos', 'all'], ['bows', 'lazos', 'all'], ['bears', 'osos', 'all'], ['teddy bears', 'ositos', 'all'], ['puppies', 'perritos', 'all'], ['lightning', 'rayo', 'all'], ['fire', 'fuego', 'all'], ['ice cream', 'helado', 'all'], ['pizza', 'pizza', 'all'], ['donut', 'dona', 'all'], ['coffee', 'café', 'all'], ['cupcake', 'cupcake', 'all'], ['balloon', 'globo', 'all'], ['bow', 'lazo', 'all'], ['letters', 'letras', 'all'], ['cartoon', 'dibujos animados', 'all'], ['polka dots', 'lunares', 'all'], ['new', 'nuevo'], ['unisex', 'unisex', 'all'], ['small', 'pequeño'], ['medium', 'mediano'], ['large', 'grande'], ['extra large', 'extra grande']]),
    P('styles', [['long sleeve', 'de manga larga'], ['short sleeve', 'de manga corta'], ['sleeveless', 'sin mangas'], ['off shoulder', 'con hombros descubiertos'], ['one shoulder', 'de un hombro'], ['strapless', 'sin tirantes'],
      ['v neck', 'de cuello en V'], ['high waist', 'de tiro alto'], ['low waist', 'de tiro bajo'], ['wide leg', 'de pierna ancha'], ['straight leg', 'de pierna recta'], ['polka dot', 'de lunares'], ['plaid', 'de cuadros'],
      ['checkered', 'de cuadros'], ['ruffle', 'con volantes'], ['ruffled', 'con volantes'], ['sequin', 'con lentejuelas'], ['sequined', 'con lentejuelas'], ['backless', 'con espalda descubierta'], ['lace up', 'con cordones'],
      ['button', 'con botones'], ['pockets', 'con bolsillos'], ['pocket', 'con bolsillo'], ['hooded', 'con capucha'], ['zip', 'con cierre'], ['plus size', 'talla grande'], ['one size', 'talla única'], ['free size', 'talla única'],
      ['for women', 'para mujer'], ['for men', 'para hombre'], ['for kids', 'para niños'], ['for girls', 'para niña'], ['for boys', 'para niño'], ['for baby', 'para bebé'], ['women', 'de mujer'], ['womens', 'de mujer'], ['mens', 'de hombre'], ['men', 'de hombre'], ['kids', 'para niños'], ['girls', 'para niña'], ['boys', 'para niño'], ['baby', 'para bebé']]),
    M('materials', [['cotton', 'algodón'], ['linen', 'lino'], ['silk', 'seda'], ['satin', 'satén'], ['velvet', 'terciopelo'], ['denim', 'jean'], ['leather', 'cuero'], ['faux leather', 'cuero sintético'], ['suede', 'gamuza'],
      ['wool', 'lana'], ['knit', 'punto'], ['crochet', 'crochet'], ['lace', 'encaje'], ['chiffon', 'gasa'], ['tulle', 'tul'], ['mesh', 'malla'], ['fleece', 'polar'], ['corduroy', 'pana'], ['nylon', 'nailon'],
      ['polyester', 'poliéster'], ['spandex', 'licra'], ['straw', 'paja'], ['canvas', 'lona'], ['metal', 'metal'], ['plastic', 'plástico'], ['wood', 'madera'], ['cotton blend', 'mezcla de algodón']]),
    C('more', [['and', 'y'], ['&', 'y'], ['with', 'con'], ['for', 'para'], ['in', 'en'], ['or', 'o'], ['of', 'de'], ['without', 'sin']]),
    L('more', [['xs', 'XS'], ['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL'], ['xxl', 'XXL'], ['3xl', '3XL']]),
    X('more', [['size', 'talla']])
  );

  // ---- more things people sell (added after the first list; older libraries get these on the next start) ----------------------------
  const NP = (c, rows) => N(c, rows);
  const MORE = [].concat(
    NP('clothes', [['camisole', 'camiseta de tirantes', 'f', 0, 'camisetas de tirantes'], ['tube top', 'top tubo', 'm', 0, 'tops tubo'], ['bralette', 'bralette', 'm'], ['corset', 'corsé', 'm'], ['polo shirt', 'camisa polo', 'f'], ['polo', 'polo', 'm'],
      ['turtleneck', 'suéter de cuello alto', 'm', 0, 'suéteres de cuello alto'], ['tunic', 'túnica', 'f'], ['kimono', 'kimono', 'm'], ['poncho', 'poncho', 'm'], ['shawl', 'chal', 'm'], ['cape', 'capa', 'f'], ['peplum top', 'blusa peplum', 'f', 0, 'blusas peplum'],
      ['pullover', 'pulóver', 'm'], ['windbreaker', 'cortavientos', 'm', 0, 'cortavientos'], ['puffer jacket', 'chaqueta acolchada', 'f', 0, 'chaquetas acolchadas'], ['bomber jacket', 'chaqueta bomber', 'f'], ['denim jacket', 'chaqueta de jean', 'f'],
      ['leather jacket', 'chaqueta de cuero', 'f'], ['track jacket', 'chaqueta deportiva', 'f', 0, 'chaquetas deportivas'], ['trench coat', 'gabardina', 'f'], ['raincoat', 'impermeable', 'm'], ['parka', 'parka', 'f'], ['suit', 'traje', 'm'], ['tuxedo', 'esmoquin', 'm'], ['waistcoat', 'chaleco', 'm'],
      ['sundress', 'vestido de verano', 'm'], ['cocktail dress', 'vestido de coctel', 'm'], ['evening dress', 'vestido de noche', 'm'], ['prom dress', 'vestido de graduación', 'm'], ['wedding dress', 'vestido de novia', 'm'], ['bridesmaid dress', 'vestido de dama de honor', 'm'],
      ['shirt dress', 'vestido camisero', 'm', 0, 'vestidos camiseros'], ['sweater dress', 'vestido de suéter', 'm'], ['slip dress', 'vestido de tirantes', 'm'], ['tube dress', 'vestido tubo', 'm'], ['pinafore', 'jumper', 'm', 0, 'jumpers'], ['kaftan', 'caftán', 'm'], ['abaya', 'abaya', 'f'], ['beach dress', 'vestido de playa', 'm'],
      ['culottes', 'culottes', 'm', 1], ['capris', 'pescadores', 'm', 1], ['bermuda shorts', 'bermudas', 'f', 1], ['bermudas', 'bermudas', 'f', 1], ['skort', 'falda short', 'f', 0, 'faldas short'], ['pencil skirt', 'falda lápiz', 'f', 0, 'faldas lápiz'], ['tennis skirt', 'falda de tenis', 'f'],
      ['wrap skirt', 'falda envolvente', 'f', 0, 'faldas envolventes'], ['tutu', 'tutú', 'm'], ['sarong', 'pareo', 'm'], ['jeggings', 'jeggings', 'f', 1], ['flare pants', 'pantalones acampanados', 'm', 1], ['bell bottoms', 'pantalones acampanados', 'm', 1], ['harem pants', 'pantalones harem', 'm', 1],
      ['chinos', 'chinos', 'm', 1], ['slacks', 'pantalones de vestir', 'm', 1], ['hot pants', 'hot pants', 'm', 1], ['pajama pants', 'pantalones de pijama', 'm', 1], ['gym shorts', 'shorts deportivos', 'm', 1], ['bike shorts', 'licras cortas', 'f', 1],
      ['matching set', 'conjunto a juego', 'm', 0, 'conjuntos a juego'], ['lounge set', 'conjunto de descanso', 'm'], ['pajama set', 'conjunto de pijama', 'm'], ['one piece swimsuit', 'traje de baño de una pieza', 'm'], ['tankini', 'tankini', 'm'], ['cover up', 'salida de playa', 'f'],
      ['sports bra', 'sostén deportivo', 'm', 0, 'sostenes deportivos'], ['activewear', 'ropa deportiva', 'f', 0, 'ropa deportiva'], ['leotard', 'leotardo', 'm'], ['yoga set', 'conjunto de yoga', 'm'],
      ['nightgown', 'camisón', 'm'], ['nightdress', 'camisón', 'm'], ['slip', 'enagua', 'f'], ['panties', 'pantaletas', 'f', 1], ['briefs', 'calzoncillos', 'm', 1], ['boxers', 'bóxers', 'm', 1], ['thong', 'tanga', 'f'], ['shapewear', 'faja', 'f'], ['stockings', 'medias', 'f', 1], ['undershirt', 'camiseta interior', 'f', 0, 'camisetas interiores'],
      ['onesie', 'mameluco', 'm'], ['school uniform', 'uniforme escolar', 'm', 0, 'uniformes escolares'], ['bib', 'babero', 'm'], ['beanie', 'gorro', 'm'], ['bonnet', 'gorro', 'm'], ['bucket hat', 'sombrero de pescador', 'm'], ['sun hat', 'sombrero de sol', 'm'], ['fedora', 'fedora', 'm'], ['visor', 'visera', 'f'],
      ['tie', 'corbata', 'f'], ['bow tie', 'pajarita', 'f'], ['suspenders', 'tirantes', 'm', 1], ['umbrella', 'paraguas', 'm', 0, 'paraguas'], ['bandana', 'bandana', 'f'], ['head wrap', 'pañuelo para la cabeza', 'm']]),
    NP('shoes', [['loafers', 'mocasines', 'm', 1], ['pumps', 'zapatos de tacón', 'm', 1], ['wedges', 'cuñas', 'f', 1], ['platforms', 'plataformas', 'f', 1], ['stilettos', 'stilettos', 'm', 1], ['ballet flats', 'bailarinas', 'f', 1], ['espadrilles', 'alpargatas', 'f', 1], ['flip flops', 'chancletas', 'f', 1],
      ['crocs', 'crocs', 'm', 1], ['ankle boots', 'botines', 'm', 1], ['knee high boots', 'botas altas', 'f', 1], ['rain boots', 'botas de lluvia', 'f', 1], ['work boots', 'botas de trabajo', 'f', 1], ['trainers', 'tenis', 'm', 1], ['running shoes', 'zapatos para correr', 'm', 1],
      ['mules', 'mules', 'f', 1], ['clogs', 'zuecos', 'm', 1], ['high tops', 'tenis altos', 'm', 1], ['crossbody bag', 'bolso cruzado', 'm', 0, 'bolsos cruzados'], ['shoulder bag', 'bolso de hombro', 'm'], ['bucket bag', 'bolso tipo cubo', 'm'], ['fanny pack', 'riñonera', 'f'], ['belt bag', 'riñonera', 'f'],
      ['duffel bag', 'bolso deportivo', 'm', 0, 'bolsos deportivos'], ['suitcase', 'maleta', 'f'], ['travel bag', 'bolso de viaje', 'm'], ['makeup bag', 'bolso de maquillaje', 'm'], ['laptop bag', 'bolso para laptop', 'm'], ['lunch bag', 'lonchera', 'f'], ['beach bag', 'bolso de playa', 'm'], ['tote', 'bolso tote', 'm'],
      ['satchel', 'maletín', 'm'], ['diaper bag', 'bolso de pañales', 'm'], ['phone case', 'funda de teléfono', 'f'], ['card holder', 'tarjetero', 'm'], ['coin purse', 'monedero', 'm'], ['keychain', 'llavero', 'm'],
      ['studs', 'aretes pequeños', 'm', 1], ['hoops', 'aros', 'm', 1], ['pendant', 'colgante', 'm'], ['chain', 'cadena', 'f'], ['choker', 'gargantilla', 'f'], ['brooch', 'broche', 'm'], ['cufflinks', 'gemelos', 'm', 1], ['bangle', 'brazalete', 'm'], ['toe ring', 'anillo para el pie', 'm'], ['jewelry set', 'juego de joyas', 'm', 0, 'juegos de joyas'],
      ['hair clip', 'pinza para el cabello', 'f'], ['headband', 'cintillo', 'm'], ['hair band', 'cintillo', 'm'], ['scrunchie', 'scrunchie', 'f'], ['hair tie', 'liga para el cabello', 'f'], ['wig', 'peluca', 'f'], ['hair extensions', 'extensiones', 'f', 1], ['glasses', 'lentes', 'm', 1], ['smart watch', 'reloj inteligente', 'm', 0, 'relojes inteligentes'],
      ['lipstick', 'labial', 'm'], ['lip gloss', 'brillo labial', 'm', 0, 'brillos labiales'], ['nail polish', 'esmalte de uñas', 'm'], ['body spray', 'rocío corporal', 'm'], ['lotion', 'loción', 'f'], ['makeup', 'maquillaje', 'm'], ['eyelashes', 'pestañas', 'f', 1],
      ['towel', 'toalla', 'f'], ['blanket', 'manta', 'f'], ['pillow', 'almohada', 'f'], ['curtain', 'cortina', 'f'], ['bedsheet', 'sábana', 'f'], ['candle', 'vela', 'f'],
      ['pair', 'par', 'm'], ['pack', 'paquete', 'm'], ['bundle', 'paquete', 'm'], ['lot', 'lote', 'm'], ['dozen', 'docena', 'f']]),
    // more things to sell: clothes, shoes, bags and jewellery, beauty and home
    N('clothes', [['dungarees', 'overol de mezclilla', 'm'], ['gym set', 'conjunto de gimnasio', 'm'], ['jean shorts', 'short de mezclilla', 'm'], ['swim trunks', 'pantaloneta de baño', 'f', 1], ['bikini bottom', 'calzón de bikini', 'm'], ['uniform', 'uniforme', 'm'], ['scrubs', 'uniforme médico', 'm'], ['apron', 'delantal', 'm'], ['bodystocking', 'body de malla', 'm'], ['girdle', 'faja moldeadora', 'f'], ['pantyhose', 'pantimedias', 'f', 1], ['leg warmers', 'calentadores', 'm', 1], ['hair bow', 'lazo para el cabello', 'm'], ['dance wear', 'ropa de baile', 'f'], ['baby set', 'conjunto de bebé', 'm'], ['baby romper', 'mameluco de bebé', 'm'], ['sweatshirt dress', 'vestido sudadera', 'm'], ['party dress', 'vestido de fiesta', 'm'], ['maxi skirt', 'falda larga', 'f'], ['pleated skirt', 'falda plisada', 'f'], ['mom jeans', 'jeans mom', 'm', 1], ['capri pants', 'pantalones capri', 'm', 1], ['blazer set', 'conjunto de blazer', 'm'], ['two piece set', 'conjunto de dos piezas', 'm'], ['three piece set', 'conjunto de tres piezas', 'm'], ['crop top set', 'conjunto de crop top', 'm'], ['knit set', 'conjunto tejido', 'm'], ['polo neck', 'cuello alto', 'm'], ['henley', 'henley', 'm'], ['jersey', 'jersey', 'm'], ['sari', 'sari', 'm'], ['shrug', 'bolero', 'm'], ['scarf set', 'juego de bufanda', 'm'], ['gloves and hat set', 'juego de gorro y guantes', 'm']]),
    N('shoes', [['flip flop', 'chancleta', 'f'], ['house slippers', 'pantuflas de casa', 'f', 1], ['athletic shoes', 'zapatos deportivos', 'm', 1], ['dress shoes', 'zapatos de vestir', 'm', 1], ['school shoes', 'zapatos escolares', 'm', 1], ['water shoes', 'zapatos de agua', 'm', 1], ['sandal', 'sandalia', 'f'], ['boot', 'bota', 'f'], ['heel', 'tacón', 'm'], ['wedge sandals', 'sandalias de cuña', 'f', 1], ['platform sandals', 'sandalias de plataforma', 'f', 1], ['gladiator sandals', 'sandalias romanas', 'f', 1], ['jelly sandals', 'sandalias de goma', 'f', 1], ['ankle strap heels', 'tacones con tobillera', 'm', 1], ['block heels', 'tacones gruesos', 'm', 1], ['kitten heels', 'tacones bajos', 'm', 1], ['peep toe', 'punta abierta', 'f'], ['shopping bag', 'bolsa de compras', 'f'], ['gift bag', 'bolsa de regalo', 'f'], ['messenger bag', 'bolso bandolera', 'm'], ['briefcase', 'maletín ejecutivo', 'm'], ['luggage', 'equipaje', 'm'], ['pouch', 'estuche', 'm'], ['pencil case', 'cartuchera', 'f'], ['phone charger', 'cargador de teléfono', 'm'], ['earphones', 'audífonos', 'm', 1], ['headphones', 'audífonos grandes', 'm', 1], ['power bank', 'batería portátil', 'f'], ['gold chain', 'cadena de oro', 'f'], ['hoop earrings', 'argollas', 'f', 1], ['cuff', 'puño', 'm'], ['charm bracelet', 'pulsera de dijes', 'f'], ['ear cuff', 'ear cuff', 'm'], ['hair pin', 'gancho para el cabello', 'm'], ['reading glasses', 'lentes de lectura', 'm', 1], ['blue light glasses', 'lentes de luz azul', 'm', 1], ['watch strap', 'correa de reloj', 'f'], ['fan', 'abanico', 'm'], ['pocket square', 'pañuelo de bolsillo', 'm'], ['handkerchief', 'pañuelo', 'm'], ['bandanna', 'pañuelo de cabeza', 'm'], ['beret', 'boina', 'f'], ['straw hat', 'sombrero de paja', 'm'], ['earmuffs', 'orejeras', 'f', 1], ['mittens', 'manoplas', 'f', 1], ['knee socks', 'calcetines largos', 'm', 1], ['ankle socks', 'calcetines tobilleros', 'm', 1], ['no show socks', 'calcetines invisibles', 'm', 1], ['compression socks', 'calcetines de compresión', 'm', 1]]),
    N('more', [['eyeshadow', 'sombras', 'f', 1], ['mascara', 'rímel', 'm'], ['eyeliner', 'delineador', 'm'], ['foundation', 'base de maquillaje', 'f'], ['concealer', 'corrector', 'm'], ['highlighter', 'iluminador', 'm'], ['false nails', 'uñas postizas', 'f', 1], ['false lashes', 'pestañas postizas', 'f', 1], ['makeup brushes', 'brochas de maquillaje', 'f', 1], ['sponge', 'esponja', 'f'], ['mirror', 'espejo', 'm'], ['body lotion', 'crema corporal', 'f'], ['body mist', 'bruma corporal', 'f'], ['cologne', 'colonia', 'f'], ['deodorant', 'desodorante', 'm'], ['shampoo', 'champú', 'm'], ['hair oil', 'aceite para el cabello', 'm'], ['hair dryer', 'secador de pelo', 'm'], ['hair straightener', 'plancha de pelo', 'f'], ['curling iron', 'rizador', 'm'], ['razor', 'máquina de afeitar', 'f'], ['bed sheets', 'sábanas', 'f', 1], ['curtains', 'cortinas', 'f', 1], ['tablecloth', 'mantel', 'm'], ['incense', 'incienso', 'm'], ['vase', 'florero', 'm'], ['picture frame', 'portarretratos', 'm'], ['water bottle', 'botella de agua', 'f'], ['tumbler', 'vaso térmico', 'm'], ['cup', 'taza', 'f'], ['plate', 'plato', 'm'], ['toy', 'juguete', 'm'], ['doll', 'muñeca', 'f'], ['stuffed animal', 'peluche', 'm'], ['party supplies', 'artículos de fiesta', 'm', 1], ['gift set', 'set de regalo', 'm'], ['gift box', 'caja de regalo', 'f'], ['bouquet', 'ramo', 'm'], ['greeting card', 'tarjeta', 'f'], ['notebook', 'cuaderno', 'm'], ['pen', 'bolígrafo', 'm'], ['sticker', 'calcomanía', 'f'], ['stickers', 'calcomanías', 'f', 1], ['tape', 'cinta', 'f'], ['fabric', 'tela', 'f'], ['ribbon', 'cinta de tela', 'f'], ['buttons', 'botones', 'm', 1], ['zipper', 'cremallera', 'f'], ['thread', 'hilo', 'm'], ['needle', 'aguja', 'f'], ['yarn', 'estambre', 'm']]),
    // more things to sell, in the Spanish the shop's customers use (Venezuelan)
    N('clothes', [['blouse oversized', 'blusón', 'm'], ['school shirt', 'chemise escolar', 'f'], ['school skirt', 'falda escolar', 'f'], ['school pants', 'pantalón escolar', 'm'], ['sweater vest', 'chaleco de suéter', 'm'], ['denim skirt', 'falda de jean', 'f'], ['denim dress', 'vestido de jean', 'm'], ['denim vest', 'chaleco de jean', 'm'], ['denim shirt', 'camisa de jean', 'f'], ['denim pants', 'pantalón de jean', 'm'], ['linen pants', 'pantalón de lino', 'm'], ['linen shirt', 'camisa de lino', 'f'], ['satin dress', 'vestido de satén', 'm'], ['lace dress', 'vestido de encaje', 'm'], ['lace top', 'blusa de encaje', 'f'], ['crop jacket', 'chaqueta corta', 'f'], ['long coat', 'abrigo largo', 'm'], ['wool coat', 'abrigo de lana', 'm'], ['knit sweater', 'suéter tejido', 'm'], ['knit dress', 'vestido tejido', 'm'], ['knit cardigan', 'cárdigan tejido', 'm'], ['tank top set', 'conjunto de franela sin mangas', 'm'], ['swimwear', 'ropa de baño', 'f'], ['beachwear', 'ropa de playa', 'f'], ['sleepwear', 'ropa de dormir', 'f'], ['loungewear', 'ropa de casa', 'f'], ['gym leggings', 'leggins deportivos', 'm', 1], ['sports top', 'top deportivo', 'm'], ['sport shorts', 'short deportivo', 'm'], ['cycling shorts', 'licra ciclista', 'f'], ['thermal underwear', 'ropa interior térmica', 'f'], ['maternity dress', 'vestido de maternidad', 'm'], ['nursing bra', 'sostén de lactancia', 'm'], ['baby dress', 'vestido de bebé', 'm'], ['baby bodysuit', 'body de bebé', 'm'], ['baby blanket', 'cobija de bebé', 'f'], ['kids set', 'conjunto de niño', 'm'], ['girls dress', 'vestido de niña', 'm'], ['boys shirt', 'camisa de niño', 'f'], ['boys shorts', 'short de niño', 'm'], ['girls skirt', 'falda de niña', 'f']]),
    N('shoes', [['screen protector', 'protector de pantalla', 'm'], ['phone holder', 'soporte de celular', 'm'], ['usb cable', 'cable usb', 'm'], ['charging cable', 'cable de carga', 'm'], ['car charger', 'cargador de carro', 'm'], ['wireless earbuds', 'audífonos inalámbricos', 'm', 1], ['bluetooth speaker', 'corneta bluetooth', 'f'], ['speaker', 'corneta', 'f'], ['selfie stick', 'palo de selfie', 'm'], ['ring light', 'aro de luz', 'm'], ['costume jewelry', 'bisutería', 'f'], ['jewelry box', 'joyero', 'm'], ['necklace set', 'juego de collar', 'm'], ['ring set', 'juego de anillos', 'm'], ['earring set', 'juego de zarcillos', 'm'], ['bracelet set', 'juego de pulseras', 'm'], ['pearl necklace', 'collar de perlas', 'm'], ['pearl earrings', 'zarcillos de perlas', 'm', 1], ['gold earrings', 'zarcillos de oro', 'm', 1], ['gold ring', 'anillo de oro', 'm'], ['silver ring', 'anillo de plata', 'm'], ['silver chain', 'cadena de plata', 'f'], ['name necklace', 'collar con nombre', 'm'], ['initial necklace', 'collar con inicial', 'm'], ['school backpack', 'mochila escolar', 'f'], ['mini backpack', 'mochila pequeña', 'f'], ['travel backpack', 'mochila de viaje', 'f'], ['handbag set', 'juego de carteras', 'm'], ['wristlet', 'muñequera con cartera', 'f'], ['cosmetic bag', 'cosmetiquera', 'f'], ['toiletry bag', 'bolso de aseo', 'm'], ['bag charm', 'adorno para cartera', 'm'], ['wallet chain', 'cadena de billetera', 'f'], ['hair claw', 'pinza grande para el cabello', 'f'], ['hair clips set', 'juego de pinzas', 'm'], ['hair ties set', 'juego de cauchos', 'm'], ['hair brush', 'cepillo', 'm'], ['comb', 'peine', 'm'], ['hair mask', 'mascarilla capilar', 'f'], ['hair spray', 'laca', 'f'], ['hair gel', 'gel para el cabello', 'm'], ['hair serum', 'suero capilar', 'm']]),
    N('more', [['sheet set', 'juego de sábanas', 'm'], ['comforter', 'edredón', 'm'], ['towel set', 'juego de toallas', 'm'], ['bath towel', 'toalla de baño', 'f'], ['beach towel', 'toalla de playa', 'f'], ['bed spread', 'colcha', 'f'], ['mattress cover', 'protector de colchón', 'm'], ['pillow case', 'funda de almohada', 'f'], ['room spray', 'ambientador', 'm'], ['air freshener', 'ambientador de ambiente', 'm'], ['perfume set', 'juego de perfumes', 'm'], ['lotion set', 'juego de cremas', 'm'], ['skin care', 'cuidado de la piel', 'm'], ['face cream', 'crema facial', 'f'], ['face mask', 'mascarilla facial', 'f'], ['sunscreen', 'protector solar', 'm'], ['lip balm', 'bálsamo labial', 'm'], ['lip liner', 'delineador de labios', 'm'], ['eyebrow pencil', 'lápiz de cejas', 'm'], ['compact powder', 'polvo compacto', 'm'], ['setting spray', 'fijador de maquillaje', 'm'], ['nail kit', 'kit de uñas', 'm'], ['nail stickers', 'calcomanías para uñas', 'f', 1], ['tweezers', 'pinzas', 'f', 1], ['perfume bottle', 'frasco de perfume', 'm'], ['gift card', 'tarjeta de regalo', 'f'], ['wrapping paper', 'papel de regalo', 'm'], ['birthday cake', 'torta de cumpleaños', 'f'], ['birthday balloons', 'globos de cumpleaños', 'm', 1], ['party hat', 'gorro de fiesta', 'm'], ['bath bomb', 'bomba de baño', 'f'], ['slippers set', 'juego de pantuflas', 'm'], ['storage box', 'caja organizadora', 'f'], ['organizer', 'organizador', 'm'], ['hanger', 'gancho de ropa', 'm'], ['hangers', 'ganchos de ropa', 'm', 1], ['laundry bag', 'bolsa de ropa sucia', 'f'], ['lunch box set', 'juego de lonchera', 'm'], ['thermos', 'termo', 'm'], ['school supplies', 'útiles escolares', 'm', 1], ['stationery', 'papelería', 'f'], ['calculator', 'calculadora', 'f'], ['backpack set', 'juego de mochila', 'm']]),
    A('colours', [['light grey', 'gris claro', 'all'], ['light gray', 'gris claro', 'all'], ['dark grey', 'gris oscuro', 'all'], ['dark gray', 'gris oscuro', 'all'], ['light brown', 'marrón claro', 'all'], ['dark brown', 'marrón oscuro', 'all'], ['dark red', 'rojo oscuro', 'all'], ['light yellow', 'amarillo claro', 'all'],
      ['neon pink', 'rosado neón', 'all'], ['neon green', 'verde neón', 'all'], ['neon orange', 'anaranjado neón', 'all'], ['pastel', 'pastel', 'all'], ['dusty pink', 'rosa palo', 'all'], ['blush', 'rosa palo', 'all'], ['baby pink', 'rosado pastel', 'all'], ['powder blue', 'azul pálido', 'all'],
      ['cobalt', 'azul cobalto', 'all'], ['electric blue', 'azul eléctrico', 'all'], ['denim blue', 'azul jean', 'all'], ['indigo', 'índigo', 'all'], ['violet', 'violeta', 'all'], ['plum', 'ciruela', 'all'], ['mauve', 'malva', 'all'], ['raspberry', 'frambuesa', 'all'], ['cherry', 'cereza', 'all'],
      ['scarlet', 'escarlata', 'all'], ['crimson', 'carmesí', 'all'], ['jade', 'jade', 'all'], ['mocha', 'moca', 'all'], ['chocolate', 'chocolate', 'all'], ['camel', 'camel', 'all'], ['taupe', 'topo', 'all'], ['ecru', 'crudo', 'all'], ['sand', 'arena', 'all'], ['stone', 'piedra', 'all'], ['apricot', 'albaricoque', 'all'],
      ['tangerine', 'mandarina', 'all'], ['lemon', 'limón', 'all'], ['pearl', 'perla', 'all'], ['metallic gold', 'dorado metálico', 'all'], ['metallic silver', 'plateado metálico', 'all'], ['rose', 'rosa', 'all'], ['heather grey', 'gris jaspeado', 'all'], ['oatmeal', 'avena', 'all'], ['burnt orange', 'naranja quemado', 'all'],
      ['bottle green', 'verde botella', 'all'], ['cyan', 'cian', 'all'], ['ice blue', 'azul hielo', 'all'], ['dusty blue', 'azul empolvado', 'all'], ['wine red', 'rojo vino', 'all']]),
    A('styles', [['two tone', 'bicolor', 'all'], ['tie dye', 'tie dye', 'all'], ['camo', 'camuflado'], ['camouflage', 'camuflado'], ['paisley', 'paisley', 'all'], ['geometric', 'geométrico'], ['abstract', 'abstracto'], ['metallic', 'metálico'], ['shiny', 'brillante'], ['matte', 'mate', 'all'],
      ['sheer', 'transparente'], ['see through', 'transparente', 'all'], ['lined', 'forrado'], ['padded', 'acolchado'], ['quilted', 'acolchado'], ['waterproof', 'impermeable', 'all'], ['breathable', 'transpirable'], ['push up', 'push up', 'all'], ['adjustable', 'ajustable'], ['elastic', 'elástico'],
      ['low cut', 'escotado'], ['skinny', 'skinny', 'all'], ['straight', 'recto'], ['flared', 'acampanado'], ['bootcut', 'bootcut', 'all'], ['baggy', 'holgado'], ['relaxed', 'holgado'], ['tailored', 'entallado'], ['bodycon', 'ajustado'], ['asymmetric', 'asimétrico'], ['wrap', 'cruzado'],
      ['ruched', 'fruncido'], ['distressed', 'rasgado'], ['ripped', 'rasgado'], ['washed', 'lavado'], ['frayed', 'deshilachado'], ['full length', 'largo'], ['petite', 'petite', 'all'], ['tall', 'alto'], ['curvy', 'curvy', 'all'], ['school', 'escolar'], ['custom', 'personalizado'], ['original', 'original'], ['authentic', 'auténtico'],
      ['brand new', 'nuevo'], ['used', 'usado'], ['preloved', 'usado'], ['imported', 'importado'], ['embellished', 'adornado'], ['extra small', 'extra pequeño']]),
    P('styles', [['long sleeves', 'de manga larga'], ['short sleeves', 'de manga corta'], ['round neck', 'de cuello redondo'], ['crew neck', 'de cuello redondo'], ['scoop neck', 'de cuello redondo'], ['square neck', 'de cuello cuadrado'], ['halter neck', 'de cuello halter'], ['high neck', 'de cuello alto'],
      ['cowl neck', 'de cuello caído'], ['boat neck', 'de cuello barco'], ['collared', 'con cuello'], ['deep v', 'de escote profundo'], ['sweetheart', 'de escote corazón'], ['puff sleeve', 'de manga abullonada'], ['bell sleeve', 'de manga campana'], ['batwing', 'de manga murciélago'],
      ['three quarter sleeve', 'de manga tres cuartos'], ['cap sleeve', 'de manga casquillo'], ['flutter sleeve', 'de manga volante'], ['half sleeve', 'de media manga'], ['strappy', 'de tirantes'], ['spaghetti strap', 'de tirantes finos'], ['thin strap', 'de tirantes finos'], ['cold shoulder', 'con hombros descubiertos'],
      ['animal print', 'de estampado animal'], ['leopard print', 'de leopardo'], ['zebra print', 'de cebra'], ['snake print', 'de serpiente'], ['graphic', 'con estampado gráfico'], ['gingham', 'de cuadros vichy'], ['houndstooth', 'de pata de gallo'], ['checked', 'de cuadros'], ['pinstripe', 'de rayas finas'],
      ['glitter', 'con brillo'], ['quick dry', 'de secado rápido'], ['seamless', 'sin costuras'], ['wireless', 'sin aro'], ['a line', 'en A'], ['empire', 'de corte imperio'], ['belted', 'con cinturón'], ['tiered', 'de capas'], ['layered', 'en capas'], ['smocked', 'con smock'], ['acid wash', 'de lavado ácido'],
      ['high rise', 'de tiro alto'], ['mid rise', 'de tiro medio'], ['low rise', 'de tiro bajo'], ['high waisted', 'de tiro alto'], ['knee length', 'hasta la rodilla'], ['ankle length', 'hasta el tobillo'], ['floor length', 'hasta el piso'], ['maternity', 'de maternidad'], ['nursing', 'de lactancia'],
      ['work', 'de trabajo'], ['party', 'de fiesta'], ['wedding', 'de boda'], ['evening', 'de noche'], ['summer', 'de verano'], ['winter', 'de invierno'], ['beach', 'de playa'], ['hand made', 'hecho a mano'], ['handmade', 'hecho a mano'], ['designer', 'de diseñador'], ['luxury', 'de lujo'],
      ['second hand', 'de segunda mano'], ['new with tags', 'nuevo con etiqueta'], ['beaded', 'con cuentas'], ['studded', 'con tachuelas'], ['fringe', 'con flecos'], ['tassel', 'con borlas'], ['rhinestone', 'con pedrería'], ['one size fits all', 'talla única'], ['for her', 'para ella'], ['for him', 'para él']]),
    M('materials', [['viscose', 'viscosa'], ['rayon', 'rayón'], ['acrylic', 'acrílico'], ['cashmere', 'cachemira'], ['terry', 'toalla'], ['sherpa', 'sherpa'], ['faux fur', 'pelo sintético'], ['fur', 'piel'], ['leatherette', 'cuero sintético'], ['pu leather', 'cuero sintético'], ['vegan leather', 'cuero vegano'],
      ['jacquard', 'jacquard'], ['brocade', 'brocado'], ['organza', 'organza'], ['taffeta', 'tafetán'], ['crepe', 'crepé'], ['georgette', 'georgette'], ['poplin', 'popelín'], ['twill', 'sarga'], ['tweed', 'tweed'], ['flannel', 'franela'], ['bamboo', 'bambú'], ['hemp', 'cáñamo'], ['modal', 'modal'], ['lycra', 'licra'],
      ['elastane', 'elastano'], ['neoprene', 'neopreno'], ['silicone', 'silicona'], ['glass', 'vidrio'], ['ceramic', 'cerámica'], ['stainless steel', 'acero inoxidable'], ['titanium', 'titanio'], ['brass', 'latón'], ['zinc alloy', 'aleación de zinc'], ['sterling silver', 'plata de ley'],
      ['gold plated', 'baño de oro'], ['silver plated', 'baño de plata'], ['crystal', 'cristal'], ['diamond', 'diamante']]),
    N('clothes', [['swim shorts', 'short de baño', 'm', 0, 'shorts de baño'], ['bikini cover up', 'cubre bikini', 'm'], ['bikini top', 'top de bikini', 'm'], ['bikini bottoms', 'parte de abajo de bikini', 'f']]),
    P('styles', [['letter print', 'con estampado de letras'], ['letters print', 'con estampado de letras'], ['cartoon print', 'con estampado de caricaturas'], ['cartoon bear print', 'con estampado de osito'], ['bear print', 'con estampado de osos'], ['heart print', 'con estampado de corazones'],
      ['star print', 'con estampado de estrellas'], ['flower print', 'con estampado de flores'], ['tropical print', 'con estampado tropical'], ['leaf print', 'con estampado de hojas'], ['butterfly print', 'con estampado de mariposas'], ['logo print', 'con estampado de logo'], ['slogan print', 'con estampado de frase'],
      ['number print', 'con estampado de número'], ['graphic print', 'con estampado gráfico'], ['deep v neck', 'de cuello en V profundo'], ['deep v', 'de escote profundo'], ['lantern sleeve', 'de manga farol'], ['lantern sleeves', 'de manga farol'], ['balloon sleeve', 'de manga globo'], ['balloon sleeves', 'de manga globo'],
      ['pleated waist', 'con cintura plisada'], ['gathered waist', 'con cintura fruncida'], ['gathered back', 'con espalda fruncida'], ['tie waist', 'con cintura anudada'], ['night out', 'para salir de noche'], ['floral print', 'con estampado floral'], ['print', 'con estampado'],
      ['autumn', 'de otoño'], ['fall', 'de otoño'], ['spring', 'de primavera'], ['for ladies', 'para mujer'], ['ladies', 'de mujer'], ['woman', 'de mujer'], ['womans', 'de mujer'], ['lady', 'de mujer'], ['girl', 'de niña'], ['boy', 'de niño']]),
    A('styles', [['minimalist', 'minimalista'], ['minimal', 'minimalista'], ['basic', 'básico'], ['simple', 'sencillo'], ['fashionable', 'a la moda', 'all'], ['stripe', 'rayado'], ['stripes', 'rayado'], ['chic', 'chic', 'all'], ['gathered', 'fruncido'], ['sleek', 'liso'], ['classy', 'fino'], ['trendy', 'de moda', 'all'], ['stylish', 'con estilo', 'all'], ['comfy', 'cómodo'], ['comfortable', 'cómodo'], ['lightweight', 'ligero'], ['soft', 'suave'], ['warm', 'abrigado'], ['thick', 'grueso'], ['thin', 'delgado'], ['cool', 'fresco']]),
    L('more', [['xxs', 'XXS'], ['2xl', '2XL'], ['4xl', '4XL'], ['5xl', '5XL']])
  );
  STARTER.push.apply(STARTER, MORE);
  // nouns that carry a describing word inside need their own plural ("vestidos largos")
  const PE = { 'maxi dress': 'vestidos largos', 'mini dress': 'vestidos cortos', 'midi dress': 'vestidos midi', 'wrap dress': 'vestidos cruzados', 'bodycon dress': 'vestidos ajustados', 'tracksuit': 'conjuntos deportivos' };
  STARTER.forEach((w) => { if (PE[w.en]) w.pe = PE[w.en]; });

  // The Spanish the app WRITES is Venezuelan Spanish (the shop's customers are Venezuelan): franela, cholas, zarcillos, correa, forro ...
  // [English, the neutral Spanish it used before, the Venezuelan word now]. The old word still works when someone types it.
  const VEN = [['t-shirt', 'camiseta', 'franela'], ['tee', 'camiseta', 'franela'], ['tank top', 'camiseta sin mangas', 'franela sin mangas'], ['earrings', 'aretes', 'zarcillos'], ['flip flops', 'chancletas', 'cholas'], ['slides', 'chancletas', 'chancletas tipo slide'],
    ['belt', 'cinturón', 'correa'], ['phone case', 'funda de teléfono', 'forro de teléfono'], ['sneakers', 'tenis', 'zapatos deportivos'], ['trainers', 'tenis', 'zapatos deportivos'], ['hair tie', 'liga para el cabello', 'caucho para el cabello'],
    ['socks', 'calcetines', 'medias'], ['fanny pack', 'riñonera', 'koala'], ['belt bag', 'riñonera', 'koala'], ['hoops', 'aros', 'argollas', 'f'], ['studs', 'aretes pequeños', 'zarcillos pequeños'], ['pendant', 'colgante', 'dije'], ['bow tie', 'pajarita', 'corbatín', 'm'], ['jean shorts', 'short de mezclilla', 'short de jean'], ['dungarees', 'overol de mezclilla', 'overol de jean'], ['bikini bottom', 'calzón de bikini', 'parte de abajo de bikini', 'f'], ['phone charger', 'cargador de teléfono', 'cargador de celular'], ['phone case', 'forro de teléfono', 'forro de celular'], ['body spray', 'rocío corporal', 'body splash'], ['camisole', 'camiseta de tirantes', 'franela de tirantes'], ['undershirt', 'camiseta interior', 'franela interior'], ['pinafore', 'jumper', 'braga', 'f'], ['zipper', 'cremallera', 'cierre', 'm'], ['hair dryer', 'secador de pelo', 'secador de cabello'], ['hair straightener', 'plancha de pelo', 'plancha de cabello'], ['deer', 'ciervo', 'venado'], ['deers', 'ciervos', 'venados'], ['cartoon', 'dibujos animados', 'caricaturas'], ['tights', 'medias', 'pantimedias'], ['stockings', 'medias', 'medias largas'], ['polo shirt', 'camisa polo', 'chemise']];
  VEN.forEach(([en, old, nu, g]) => { STARTER.forEach((w) => { if (w.en === en && norm(w.es) === norm(old)) { w.es = nu; if (g) w.g = g; } }); });
  const VENMAP = {}; VEN.forEach(([en, old, nu, g]) => { VENMAP[norm(en)] = [old, nu, g]; });

  // ---- the Spanish grammar bits --------------------------------------------------------------------------------------------------
  const NUM = { two: 'dos', three: 'tres', four: 'cuatro', five: 'cinco', six: 'seis', seven: 'siete', eight: 'ocho', nine: 'nueve', ten: 'diez', eleven: 'once', twelve: 'doce', thirteen: 'trece', fourteen: 'catorce', fifteen: 'quince', sixteen: 'dieciséis', seventeen: 'diecisiete', eighteen: 'dieciocho', nineteen: 'diecinueve', twenty: 'veinte' };
  const NUMV = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20 };
  const NOACC = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };
  const pluralWord = (w) => { if (!w) return w; if (/[áéíóú]n$/.test(w)) return w.slice(0, -2) + NOACC[w.charAt(w.length - 2)] + 'nes'; if (/z$/.test(w)) return w.slice(0, -1) + 'ces'; if (/[aeiouáéíóú]$/.test(w)) return w + 's'; return w + 'es'; };
  const pluralPhrase = (p) => { const a = String(p).split(' '); a[0] = pluralWord(a[0]); return a.join(' '); };
  const agree = (adj, g, pl) => {
    if (adj.inv === 'all') return adj.es;
    const a = String(adj.es).split(' '); let h = a[0];
    if (g === 'f' && /o$/.test(h)) h = h.slice(0, -1) + 'a';
    if (pl) h = pluralWord(h);
    a[0] = h; return a.join(' ');
  };

  // ---- reading the list --------------------------------------------------------------------------------------------------------
  const cache = new WeakMap();
  const index = (words) => {
    const arr = words || []; if (cache.has(arr)) return cache.get(arr);
    const m = new Map(); let max = 1;
    arr.forEach((w) => { const k = norm(w.en); if (!k || !String(w.es || '').trim()) return; m.set(k, w); max = Math.max(max, k.split(' ').length); });
    const r = { m, max }; cache.set(arr, r); return r;
  };
  const kindOf = (w) => w.t || 'x';

  // English words → pieces: matched words (longest phrase first), plural things, literals, unknown words.
  const pieces = (desc, words) => {
    const toks = String(desc || '').replace(/(\p{L})\s?\/\s?(\p{L})/gu, '$1 and $2').trim().split(/\s+/).filter(Boolean), { m, max } = index(words), out = [], missing = [];
    const tailOf = (tk) => (tk.match(/[^\p{L}\p{N}&]+$/u) || [''])[0];
    for (let i = 0; i < toks.length;) {
      const c0 = norm(clean(toks[i])), c1 = i + 1 < toks.length ? norm(clean(toks[i + 1])) : '';
      // "2 piece", "two piece", "2pc"
      let mm = c0.match(/^(\d+|two|three|four|five|six|seven|eight|nine|ten)\s?(pcs?|pieces?)$/);
      if (mm) { const n = NUM[mm[1]] || mm[1]; out.push({ k: 'p', w: { es: 'de ' + n + ' piezas' }, tail: tailOf(toks[i]) }); i++; continue; }
      mm = c0.match(/^(\d+|two|three|four|five|six|seven|eight|nine|ten)$/);
      if (mm && /^(pcs?|pieces?)$/.test(c1)) { out.push({ k: 'p', w: { es: 'de ' + (NUM[mm[1]] || mm[1]) + ' piezas' }, tail: tailOf(toks[i + 1]) }); i += 2; continue; }
      // a count in front of a thing: "two long track pants", "3 red dresses", "one dress"
      mm = c0.match(/^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\d{1,2})$/);
      if (mm) { out.push({ k: 'q', n: NUMV[mm[1]] || Number(mm[1]), word: mm[1], raw: clean(toks[i]), tail: tailOf(toks[i]) }); i++; continue; }
      let hit = false;
      for (let n = Math.min(max, toks.length - i); n >= 1 && !hit; n--) {
        const words2 = toks.slice(i, i + n).map(clean), phrase = norm(words2.join(' ')), w = phrase && m.get(phrase), tl = tailOf(toks[i + n - 1]);
        if (w) { out.push({ k: kindOf(w), w, tail: tl }); i += n; hit = true; continue; }
        const last = norm(words2[n - 1]);   // a plural thing ("dresses", "crop tops"): look for the single one
        if (last.length > 2 && /s$/.test(last)) for (const sg of [last.slice(0, -1), last.slice(0, -2), last.slice(0, -3) + 'y']) {
          const w2 = m.get(norm(words2.slice(0, n - 1).concat(sg).join(' ')));
          if (w2 && w2.t === 'n' && !w2.pl) { out.push({ k: 'n', w: w2, plural: true, tail: tl }); i += n; hit = true; break; }
        }
      }
      if (hit) continue;
      const raw = toks[i], c = c0;
      if (!c || !/\p{L}/u.test(c) || /\d/.test(c)) { out.push({ k: 'l', raw: clean(raw) || raw, tail: tailOf(raw) }); i++; continue; }
      if (!missing.includes(c)) missing.push(c);
      out.push({ k: 'u', raw: clean(raw), tail: tailOf(raw) }); i++;
    }
    return { out, missing };
  };

  // The thing first, then "de <material>", phrases like "de manga larga", then what describes it (agreeing), then anything unknown.
  const renderNP = (noun, mods) => {
    const qm = noun ? mods.find((x) => x.k === 'q') : null, many = !!(qm && qm.n !== 1);
    const g = noun ? noun.w.g || 'm' : 'm', pl = noun ? !!(noun.w.pl || noun.plural || many) : false;
    const head0 = noun ? ((noun.plural || many) && !noun.w.pl ? (noun.w.pe || pluralPhrase(noun.w.es)) : noun.w.es) : '';
    const qtext = qm ? (qm.n === 1 && qm.word === 'one' ? (g === 'f' ? 'una' : 'un') : qm.n === 1 ? '1' : NUM[qm.word] || qm.raw) : '';
    const head = [qtext, head0].filter(Boolean).join(' ');
    const groups = { m: [], p: [], a: [], ac: [], r: [] }; let join = null;
    mods.forEach((x) => {
      if (x.k === 'conn') { join = x.es; return; }
      if (x.k === 'q') { if (noun) return; groups.r.push({ text: x.raw, join }); join = null; return; }
      const g2 = x.k === 'a' ? (x.w.c === 'colours' ? 'ac' : 'a') : x.k === 'm' || x.k === 'p' ? x.k : 'r';   // colours come last ("falda mini roja")
      const text = x.k === 'a' ? agree(x.w, g, pl) : x.k === 'm' || x.k === 'p' ? x.w.es : x.raw;
      if ((g2 === 'a' || g2 === 'ac') && groups[g2].some((e) => e.text === text)) { join = null; return; }   // the same word twice ("elegant, classy") is said once
      groups[g2].push({ text, join }); join = null;
    });
    const seq = (list, first) => list.map((e, i) => (i === 0 ? (first || '') + e.text : e.join === ',' ? ', ' + e.text : (e.join ? ' ' + e.join + ' ' : ' ') + e.text)).join('');
    const matStr = groups.m.length ? seq(groups.m, head ? 'de ' : '') : '';
    return [head, matStr, seq(groups.p), seq(groups.a), seq(groups.ac), seq(groups.r)].filter(Boolean).join(' ');
  };

  const translate = (desc, words) => {
    const { out, missing } = pieces(desc, words), parts = []; let mods = [], noun = null, tail = '';
    const flush = () => { if (!noun && !mods.length) return; parts.push(renderNP(noun, mods) + tail); mods = []; noun = null; tail = ''; };
    const isMod = (k) => k === 'a' || k === 'm';
    out.forEach((it, j) => {
      if (it.k === 'n') {
        if (noun) mods.push({ k: 'm', x: 1, es: noun.w.es, w: { es: noun.w.es } });   // "pants set": the first thing describes the second ("conjunto de pantalones")
        noun = it; tail = it.tail;
      } else if (it.k === 'q') {
        mods.push(noun ? { k: 'u', raw: it.raw } : it); tail = it.tail;
      } else if (it.k === 'a' || it.k === 'm' || it.k === 'p' || it.k === 'u' || it.k === 'l') {
        mods.push(it.k === 'u' || it.k === 'l' ? { k: 'u', raw: it.raw !== undefined ? it.raw : it.w.es } : it); tail = it.tail;
        const nx = out[j + 1]; if (isMod(it.k) && /,/.test(it.tail || '') && nx && nx.k === it.k) { mods.push({ k: 'conn', es: ',' }); tail = ''; }
      } else if (it.k === 'c') {
        const prev = out[j - 1], next = out[j + 1];
        if (prev && next && isMod(prev.k) && prev.k === next.k && (it.w.es === 'y' || it.w.es === 'o')) mods.push({ k: 'conn', es: it.w.es });
        else { flush(); parts.push(it.w.es + it.tail); }
      } else { flush(); parts.push(it.w.es + it.tail); }
    });
    flush();
    return { es: cap(parts.join(' ').replace(/\s+([,;.])/g, '$1')), missing };
  };

  // The Spanish name of an item and where it stands: 'none' (no description), 'ok', or 'check' (a word is missing from the library).
  // A name the owner confirmed counts only while the description is still the one it was confirmed for.
  const spanish = (it, words) => {
    const d = String(it.desc || '').trim();
    if (!d) return { es: '', state: 'none', missing: [] };
    if (it.esSet && String(it.nameEs || '').trim() && it.esFor === it.desc) return { es: String(it.nameEs).trim(), state: 'ok', missing: [] };
    const t = translate(d, words);
    return { es: t.es, state: t.missing.length ? 'check' : 'ok', missing: t.missing };
  };
  // What the store may show in Spanish: only names that are in order; otherwise the English name stays.
  const publishable = (it, words) => { const s = spanish(it, words); return s.state === 'ok' ? s.es : ''; };

  // ---- editing the list -----------------------------------------------------------------------------------------------------------
  // The kinds of word the owner can choose (code → fields).
  const TYPES = { nm: { t: 'n', g: 'm' }, nf: { t: 'n', g: 'f' }, npm: { t: 'n', g: 'm', pl: true }, npf: { t: 'n', g: 'f', pl: true }, a: { t: 'a' }, ai: { t: 'a', inv: 'all' }, m: { t: 'm' }, p: { t: 'p' }, c: { t: 'c' }, x: { t: 'x' } };
  const typeOf = (w) => { const t = w.t || 'x'; if (t === 'n') return (w.pl ? 'np' : 'n') + (w.g === 'f' ? 'f' : 'm'); if (t === 'a') return w.inv === 'all' ? 'ai' : 'a'; return TYPES[t] ? t : 'x'; };
  const put = (words, en, es, c, type) => {
    const k = norm(en), v = String(es || '').trim(); if (!k || !v) return words;
    const i = words.findIndex((w) => norm(w.en) === k), old = i >= 0 ? words[i] : null;
    const rec = Object.assign({ en: String(en).trim().toLowerCase(), es: v, c: c !== undefined ? c : (old ? old.c : '') }, type && TYPES[type] ? TYPES[type] : (old && old.t ? { t: old.t, g: old.g, pl: old.pl, inv: old.inv } : { t: 'a' }));
    Object.keys(rec).forEach((key) => { if (rec[key] === undefined) delete rec[key]; });
    return i >= 0 ? words.map((w, j) => (j === i ? rec : w)) : words.concat(rec);
  };
  const drop = (words, en) => words.filter((w) => norm(w.en) !== norm(en));
  // The starter list: adds what is missing, and teaches older entries how they behave (thing / describing word …) without changing the
  // owner's Spanish or the groups they put words in.
  const seed = (words) => {
    const out = (words || []).map((w) => Object.assign({}, w));
    STARTER.forEach((s) => {
      const i = out.findIndex((x) => norm(x.en) === norm(s.en));
      if (i < 0) { out.push(Object.assign({}, s)); return; }
      const w = out[i];
      { const v = VENMAP[norm(s.en)]; if (v && norm(w.es) === norm(v[0])) { w.es = v[1]; if (v[2]) w.g = v[2]; } }   // a saved word still on the old neutral Spanish moves to the Venezuelan one (anything you changed yourself stays)
      if (!w.t) { ['t', 'g', 'pl', 'inv', 'pe'].forEach((k) => { if (s[k] !== undefined) w[k] = s[k]; }); }
      if (s.pe && !w.pe) w.pe = s.pe;
      if (w.c && w.c !== s.c && ['clothes', 'colours', 'sizes', 'more'].includes(w.c)) w.c = s.c;
    });
    return out;
  };

  // ---- Spanish → English (the English name of an item that was typed or spoken in Spanish) ---------------------------------------------
  // The same list read backwards. Spanish puts the thing first and what describes it after; English puts the describing words first.
  const fold = (s) => norm(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const enPlural = (w) => { const a = String(w).split(' '), l = a[a.length - 1]; a[a.length - 1] = /(s|x|z|ch|sh)$/i.test(l) ? l + 'es' : /[^aeiou]y$/i.test(l) ? l.slice(0, -1) + 'ies' : l + 's'; return a.join(' '); };
  const NUMEN = {}; Object.keys(NUM).forEach((k) => { NUMEN[fold(NUM[k])] = k; });
  const ALIASES = [['riñonera', 'fanny pack', 'riñoneras'], ['aros', 'hoops', 'aros'], ['colgante', 'pendant', 'colgantes'], ['pajarita', 'bow tie', 'pajaritas'], ['short de mezclilla', 'jean shorts', 'shorts de mezclilla'], ['overol de mezclilla', 'dungarees', 'overoles de mezclilla'], ['calzón de bikini', 'bikini bottom', 'calzones de bikini'], ['cargador de teléfono', 'phone charger', 'cargadores de teléfono'], ['rocío corporal', 'body spray', 'rocíos corporales'], ['camiseta de tirantes', 'camisole', 'camisetas de tirantes'], ['camiseta interior', 'undershirt', 'camisetas interiores'], ['cremallera', 'zipper', 'cremalleras'], ['secador de pelo', 'hair dryer', 'secadores de pelo'], ['plancha de pelo', 'hair straightener', 'planchas de pelo'], ['cobija', 'blanket', 'cobijas'], ['tennis', 'sneakers', 'tennis'], ['koala', 'fanny pack', 'koalas'], ['camiseta', 't-shirt', 'camisetas'], ['camiseta sin mangas', 'tank top', 'camisetas sin mangas'], ['franelilla', 'tank top', 'franelillas'], ['camisilla', 'tank top', 'camisillas'], ['aretes', 'earrings', 'aretes'], ['chancletas', 'flip flops', 'chancletas'], ['chancleta', 'flip flops', 'chancletas'], ['cinturón', 'belt', 'cinturones'], ['funda de teléfono', 'phone case', 'fundas de teléfono'], ['funda de celular', 'phone case', 'fundas de celular'], ['tenis', 'sneakers', 'tenis'], ['zapatos deportivos', 'sneakers', 'zapatos deportivos'], ['liga para el cabello', 'hair tie', 'ligas para el cabello'], ['cauchos', 'hair tie', 'cauchos'], ['caucho', 'hair tie', 'cauchos'], ['calcetines', 'socks', 'calcetines'], ['calcetín', 'socks', 'calcetines'], ['camisa polo', 'polo shirt', 'camisas polo'], ['pantaloneta', 'shorts', 'pantalonetas'], ['pantalonetas', 'shorts', 'pantalonetas'], ['bermuda', 'shorts', 'bermudas'], ['blue jean', 'jeans', 'blue jeans'], ['blue jeans', 'jeans', 'blue jeans'], ['bluyin', 'jeans', 'bluyines'], ['cachucha', 'cap', 'cachuchas'], ['pantys', 'panties', 'pantys'], ['pantalón', 'pants', 'pantalones'], ['pantalon', 'pants', 'pantalones'], ['short', 'shorts', 'shorts'], ['bolso', 'bag', 'bolsos'], ['bolsa', 'bag', 'bolsas'], ['correa', 'belt', 'correas'], ['cinto', 'belt', 'cintos'], ['cinturón de cuero', 'belt', 'cinturones de cuero'], ['playera', 't-shirt', 'playeras'], ['polera', 't-shirt', 'poleras'], ['zapatilla', 'sneakers', 'zapatillas'], ['zapatillas', 'sneakers', 'zapatillas'], ['zarcillos', 'earrings', 'zarcillos'], ['zarcillo', 'earrings', 'zarcillos'], ['pendientes', 'earrings', 'pendientes'], ['candongas', 'hoops', 'candongas'], ['braga', 'denim jumper', 'bragas'], ['jumper de jean', 'denim jumper', 'jumpers de jean'], ['braga de jean', 'denim jumper', 'bragas de jean'], ['jumper', 'denim jumper', 'jumpers'], ['calzón', 'panties', 'calzones'], ['blúmer', 'panties', 'blúmers'], ['truza', 'panties', 'truzas'], ['pantaleta', 'panties', 'pantaletas'], ['interior', 'panties', 'interiores'], ['bóxer', 'boxers', 'bóxers'], ['boxer', 'boxers', 'boxers'], ['licra', 'leggings', 'licras'], ['mallas', 'leggings', 'mallas'], ['calzas', 'leggings', 'calzas'], ['chamarra', 'jacket', 'chamarras'], ['brasier', 'bra', 'brasieres'], ['sujetador', 'bra', 'sujetadores'], ['forro', 'phone case', 'forros'], ['forro de celular', 'phone case', 'forros de celular'], ['forro de teléfono', 'phone case', 'forros de teléfono'], ['morral', 'backpack', 'morrales'], ['enterizo', 'jumpsuit', 'enterizos'], ['mono enterizo', 'jumpsuit', 'monos enterizos'], ['mameluco', 'romper', 'mamelucos'], ['overol', 'overalls', 'overoles'], ['gorro', 'beanie', 'gorros'], ['chal', 'shawl', 'chales'], ['lentes', 'glasses', 'lentes'], ['anteojos', 'glasses', 'anteojos'], ['gafas', 'glasses', 'gafas'], ['sandalia', 'sandals', 'sandalias'], ['bota', 'boots', 'botas'], ['tacón', 'heels', 'tacones'], ['chancleta', 'slides', 'chancletas'], ['zapato', 'shoes', 'zapatos'], ['media', 'socks', 'medias'], ['bata de baño', 'robe', 'batas de baño'], ['cholas', 'flip flops', 'cholas'], ['vestido de baño', 'swimsuit', 'vestidos de baño'], ['bañador', 'swimsuit', 'bañadores'], ['traje de baño de una pieza', 'one piece swimsuit'], ['juego', 'set', 'juegos'], ['set', 'set', 'sets'], ['juego de bisutería', 'jewelry set', 'juegos de bisutería'], ['juego de bisuteria', 'jewelry set', 'juegos de bisuteria'], ['bisutería', 'jewelry set', 'bisuterías']], MAT = [['plata', 'silver'], ['oro', 'gold']];
  const revCache = new WeakMap();
  const reverse = (words) => {
    const arr = words || []; if (revCache.has(arr)) return revCache.get(arr);
    const m = new Map(); let max = 1;
    const add = (form, rec) => { const k = fold(form); if (!k) return; if (!m.has(k)) m.set(k, rec); max = Math.max(max, k.split(' ').length); };
    arr.forEach((x) => {
      const es = String(x.es || '').trim(), en = String(x.en || '').trim(); if (!es || !en || ['de', 'y', 'o'].includes(fold(es))) return; const kind = kindOf(x);   // "de", "y", "o" are handled by the rules below
      if (kind === 'n') { add(es, { w: x, kind: 'n', pl: false }); if (!x.pl) add(x.pe || pluralPhrase(es), { w: x, kind: 'n', pl: true }); }
      else if (kind === 'a') { add(es, { w: x, kind: 'a' }); if (x.inv !== 'all') [['m', true], ['f', false], ['f', true]].forEach(([g, pl]) => add(agree(x, g, pl), { w: x, kind: 'a' })); }
      else add(es, { w: x, kind });
    });
    // other Spanish names for a thing the list already has ("vestido de baño" is also a swimsuit)
    ALIASES.forEach(([es, en, pe]) => { const w = arr.find((x) => norm(x.en) === norm(en) && kindOf(x) === 'n'); if (!w) return; add(es, { w, kind: 'n', pl: false }); add(pe || pluralPhrase(es), { w, kind: 'n', pl: true }); });
    MAT.forEach(([es, en]) => { const w = arr.find((x) => norm(x.en) === norm(en)); if (w) add(es, { w, kind: 'm' }); });   // "de plata" is a material
    // In the owner's shop "franela" is a T-shirt ("franela oso" = bear t-shirt); "de franela" is still the fabric ("pijama de franela" = flannel pajamas)
    { const ts = arr.find((x) => norm(x.en) === norm('t-shirt') && kindOf(x) === 'n'), fl = arr.find((x) => norm(x.en) === 'flannel');
      if (ts) { m.set('franela', { w: ts, kind: 'n', pl: false }); m.set('franelas', { w: ts, kind: 'n', pl: true }); }
      if (fl) { m.set('de franela', { w: fl, kind: 'm' }); max = Math.max(max, 2); } }
    const r = { m, max }; revCache.set(arr, r); return r;
  };
  const toEnglish = (desc, words) => {
    const toks = String(desc || '').trim().split(/\s+/).filter(Boolean), { m, max } = reverse(words), out = [], missing = [];
    const tailOf = (tk) => (tk.match(/[^\p{L}\p{N}&]+$/u) || [''])[0];
    for (let i = 0; i < toks.length;) {
      const c0 = fold(clean(toks[i])); let hit = false;
      if (/^\d+$/.test(c0)) { out.push({ k: 'q', text: c0, tail: tailOf(toks[i]) }); i++; continue; }
      if (NUMEN[c0]) { out.push({ k: 'q', text: NUMEN[c0], tail: tailOf(toks[i]) }); i++; continue; }
      if (c0 === 'un' || c0 === 'una') { out.push({ k: 'q', text: 'one', tail: tailOf(toks[i]) }); i++; continue; }
      // "de 2 piezas" / "de dos piezas" → "2 piece"; "talla M" → "size M" (after the thing); a lone size (XL, M …) also goes after the thing
      const pz = (j) => { const c = fold(clean(toks[j] || '')), nx = fold(clean(toks[j + 1] || '')); return /^(\d+|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)$/.test(c) && /^piezas?$/.test(nx) ? (/^\d+$/.test(c) ? c : NUMEN[c]) : null; };
      let pn = c0 === 'de' ? pz(i + 1) : pz(i), pskip = c0 === 'de' ? 3 : 2;
      if (pn) { out.push({ k: 'p2', text: pn + ' piece', tail: tailOf(toks[i + pskip - 1]) }); i += pskip; continue; }
      if (c0 === 'talla' && i + 1 < toks.length) { const sz = clean(toks[i + 1]); out.push({ k: 'post', text: 'size ' + (sz.length <= 4 ? sz.toUpperCase() : sz), tail: tailOf(toks[i + 1]) }); i += 2; continue; }
      if (/^(xxs|xs|s|m|l|xl|xxl|xxxl|[2-5]xl)$/.test(c0)) { out.push({ k: 'post', text: clean(toks[i]).toUpperCase(), tail: tailOf(toks[i]) }); i++; continue; }
      for (let n = Math.min(max, toks.length - i); n >= 1 && !hit; n--) {
        const ph = fold(toks.slice(i, i + n).map(clean).join(' ')), rec = ph && m.get(ph);
        if (rec) { out.push(Object.assign({ tail: tailOf(toks[i + n - 1]) }, rec)); i += n; hit = true; }
      }
      if (hit) continue;
      if (c0 === 'de' && i + 1 < toks.length) {   // "de lino" (a material) or "de pantalones" (a thing that describes the thing)
        const rec = m.get(fold(clean(toks[i + 1])));
        if (rec && (rec.kind === 'm' || rec.kind === 'n' || rec.kind === 'a')) { out.push(Object.assign({ via: 'de', tail: tailOf(toks[i + 1]) }, rec)); i += 2; continue; }
      }
      if (c0 === 'y' || c0 === 'o') { out.push({ k: 'c', text: c0 === 'y' ? 'and' : 'or', tail: tailOf(toks[i]) }); i++; continue; }
      if (!c0 || !/\p{L}/u.test(c0) || /\d/.test(c0)) { out.push({ k: 'l', text: clean(toks[i]) || toks[i], tail: tailOf(toks[i]) }); i++; continue; }
      if (!missing.includes(c0)) missing.push(c0);
      out.push({ k: 'u', text: clean(toks[i]), tail: tailOf(toks[i]) }); i++;
    }
    // group into things: [count] describing words … the thing
    const parts = []; let np = null;
    const fresh = () => ({ q: '', a: [], ac: [], m: [], nm: [], p: [], r: [], post: [], head: null, tail: '' });
    const flush = () => {
      if (!np) return; const g = np; np = null;
      let lone = ''; if (!g.head && g.a.length === 1 && g.a[0] === 'koala') { g.a = []; lone = 'fanny pack'; }   // "koala" on its own is a fanny pack in Venezuela; "franela koala" is the animal print
      const nounText = g.head ? (g.head.pl && !g.head.w.pl ? enPlural(g.head.w.en) : g.head.w.en) : lone;
      const seq = [g.q, ...g.ac, ...g.a, ...g.m, ...g.nm, ...g.p, ...g.r, nounText].filter(Boolean).join(' ');   // English order: the colour, then the style, the material, what it is made like, the thing
      if (seq) parts.push([seq, ...g.post].join(' ') + g.tail);
    };
    out.forEach((it, j) => {
      if (!np) np = fresh();
      if (it.k === 'q') { np.q = it.text; return; }
      if (it.k === 'c') {
        const prev = out[j - 1], next = out[j + 1];
        if (prev && next && prev.kind === 'a' && next.kind === 'a') { np[prev.w.c === 'colours' ? 'ac' : 'a'].push('and'); return; }   // "azul y rojo" → "blue and red"
        flush(); parts.push(it.text); return;
      }
      if (it.k === 'p2') { np.p.push(it.text); np.tail = it.tail; return; }
      if (it.k === 'post') { np.post.push(it.text); np.tail = it.tail; return; }
      if (it.k === 'l' || it.k === 'u') { np.r.push(it.text); np.tail = it.tail; return; }
      if (it.kind === 'n') {
        if (it.via === 'de' && np.head) { np.nm.push(it.w.en); np.tail = it.tail; return; }
        if (np.head) { flush(); np = fresh(); }
        np.head = it; np.tail = it.tail; return;
      }
      if (it.kind === 'a') { np[it.w.c === 'colours' ? 'ac' : 'a'].push(it.w.en); np.tail = it.tail; return; }
      if (it.kind === 'm') { np.m.push(it.w.en); np.tail = it.tail; return; }
      if (it.kind === 'p') { np.p.push(it.w.en); np.tail = it.tail; return; }
      np.r.push(it.w.en); np.tail = it.tail;
    });
    flush();
    return { en: cap(parts.join(' ').replace(/\s+([,;.])/g, '$1')), missing };
  };
  // The English name of an item written in Spanish: the confirmed one, or the library's best reading of the Spanish name.
  const english = (it, words) => {
    const es = spanish(it, words).es;
    if (!es) return { en: '', state: 'none', missing: [] };
    if (it.enSet && String(it.desc || '').trim() && it.enFor === es) return { en: String(it.desc).trim(), state: 'ok', missing: [] };
    const r = toEnglish(es, words);
    return { en: r.en, state: r.missing.length ? 'check' : 'ok', missing: r.missing };
  };


  // ---- spelling: a word that is not in the list but is one typo away from one that is ------------------------------------------------
  // "pulsers" is one letter from "pulsera", "braclet" one from "bracelet". The list is read in both languages, so the closest word also
  // says which language the typed word was meant to be in. Accents do not count as typos.
  const vocabCache = new WeakMap();
  const vocab = (words) => {
    const arr = words || []; if (vocabCache.has(arr)) return vocabCache.get(arr);
    const m = new Map();
    let fam = ''; const add = (txt, lang) => String(txt || '').split(/\s+/).forEach((tk) => { const w = clean(tk), k = fold(w); if (k.length >= 4 && /^\p{L}+$/u.test(k) && !m.has(k)) m.set(k, { w: w.toLowerCase(), lang, fam }); });   // fam: the word it belongs to (singular and plural share it)
    arr.forEach((x) => {
      fam = norm(x.en); add(x.en, 'en'); add(x.es, 'es'); const kind = kindOf(x);
      if (kind === 'n' && !x.pl) { add(enPlural(x.en), 'en'); add(x.pe || pluralPhrase(x.es), 'es'); }
      if (kind === 'a' && x.inv !== 'all') { try { [['m', true], ['f', false], ['f', true]].forEach(([g, pl]) => add(agree(x, g, pl), 'es')); } catch (e) { /* forms that cannot be made are skipped */ } }
    });
    ALIASES.forEach(([es, en, pe]) => { fam = norm(en); add(es, 'es'); add(pe, 'es'); });
    vocabCache.set(arr, m); return m;
  };
  // edit distance with swaps of neighbouring letters counted as one typo; gives up above `max`
  const typoDistance = (a, b, max) => {
    if (a === b) return 0; if (Math.abs(a.length - b.length) > max) return max + 1;
    const n = a.length, m = b.length, d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 0; i <= n; i++) d[i][0] = i; for (let j = 0; j <= m; j++) d[0][j] = j;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1; d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[n][m];
  };
  const keepCase = (from, to) => (from && from[0] === from[0].toUpperCase() && from[0] !== from[0].toLowerCase() ? cap(to) : to);
  // One word: null when it is a known word (or too short / not a word to judge); otherwise the closest known word.
  // { to, lang, dist } for one clear match, { ambiguous: [...] } when several words are equally close.
  const suggest = (token, words) => {
    const t = clean(String(token || '')), k = fold(t);
    if (k.length < 4 || !/^\p{L}+$/u.test(k)) return null;
    const v = vocab(words); if (v.has(k)) return null;
    if (/^(xxs|xs|xl|xxl|xxxl)$/.test(k)) return null;
    const max = k.length >= 8 ? 2 : 1; let bd = max + 1, best = [];
    for (const [vk, rec] of v) { if (Math.abs(vk.length - k.length) > max) continue; if (k.length <= 5 && vk[0] !== k[0]) continue; /* a short word with a different first letter is a different word (Nike, Bike), not a typo */ const d = typoDistance(k, vk, max); if (d > max) continue; if (d < bd) { bd = d; best = [rec]; } else if (d === bd) best.push(rec); }
    if (!best.length) return null;
    let uniq = [...new Set(best.map((r) => r.w))];
    if (uniq.length > 1 && new Set(best.map((r) => r.fam)).size === 1) { uniq = [uniq.sort((a, b) => Math.abs(fold(a).length - k.length) - Math.abs(fold(b).length - k.length) || a.length - b.length)[0]]; best = best.filter((r) => r.w === uniq[0]); }   // singular and plural of the same word: the one of the same length (a swapped letter), else the shorter
    if (uniq.length > 1) return { ambiguous: uniq.slice(0, 3).map((w) => keepCase(t, w)), dist: bd };
    return { to: keepCase(t, uniq[0]), lang: best[0].lang, dist: bd };
  };
  // A whole name: fixes the typos that are clear (one wrong letter, a word of 5+ letters, one candidate) and lists the ones it is not sure about.
  // fixes: what the owner already answered { typo: 'correct word' | null (keep it as typed) }.
  const fixText = (desc, words, fixes) => {
    const text = String(desc == null ? '' : desc), out = [], changes = [], pending = [];
    const fx = fixes || {};
    text.split(/(\s+)/).forEach((part) => {
      if (!part || /^\s+$/.test(part)) { out.push(part); return; }
      const core = clean(part), k = fold(core);
      if (Object.prototype.hasOwnProperty.call(fx, k)) { if (fx[k]) { const to = keepCase(core, fx[k]); out.push(part.replace(core, to)); changes.push({ from: core, to, lang: (suggest(to, words) || {}).lang || '', learned: true }); } else out.push(part); return; }
      const sg = suggest(core, words);
      if (!sg) { out.push(part); return; }
      if (sg.to && sg.dist === 1 && k.length >= 5) { out.push(part.replace(core, sg.to)); changes.push({ from: core, to: sg.to, lang: sg.lang }); }
      else { out.push(part); pending.push(sg.to ? { from: core, to: sg.to, lang: sg.lang } : { from: core, ambiguous: sg.ambiguous }); }
    });
    return { text: out.join(''), changes, pending };
  };

  const VERSION = 8;   // raise it when the starter list grows: the app then adds the new words to every saved list (nothing the owner typed is changed)
  const api = { suggest, fixText, typoDistance, fold, VERSION, norm, STARTER, TYPES, typeOf, translate, spanish, publishable, put, drop, seed, toEnglish, english };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Words = api;
})(typeof window !== 'undefined' ? window : globalThis);
