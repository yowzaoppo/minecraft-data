var WikiTextParser = require('./wikitext_parser');
var async=require('async');

var wikiTextParser = new WikiTextParser();
var id_table_parser=require('./id_table_template_parser.js');
var infobox_field_parser=require('./infobox_field_parser.js');

// values on infobox present on other pages :
// http://minecraft.gamepedia.com/Template:Block
// http://minecraft.gamepedia.com/index.php?title=Module:Hardness_values&action=edit
// http://minecraft.gamepedia.com/index.php?title=Module:Blast_resistance_values&action=edit

// breaking times : http://minecraft.gamepedia.com/Template:Breaking_row http://minecraft.gamepedia.com/Module:Breaking_row

// TODO: automatically get the correct section for link like http://minecraft.gamepedia.com/Technical_blocks#Piston_Head
// check Nether Brick Fence

// type values : Solid Block, Non-Solid Block, Plant, Fluid, Non-Solid, Technical, Solid,
// Ingredient<br>Block, Nonsolid Block, Block Entity, Item, Foodstuff, Tile Entity, Tool, Food, Semi-solid, Light-Emitting Block, Solid, Plants

var wikitypeToBoundingBox={
  "solid block":"block",
  "non-solid block":"empty",
  "plant":"empty",
  "fluid":"empty",
  "non-solid":"empty",
  "technical":"block",
  "solid":"block",
  "ingredient<br>block":"block",
  "nonsolid block":"empty",
  "block entity":"block",
  "item":"empty",
  "foodstuff":"empty",
  "tile entity":"block",
  "tool":"empty",
  "food":"empty",
  "semi-solid":"block",
  "light-emitting block":"block",
  "plants":"empty",
  "block":"block",
  "non-solid; plant":"empty",
  "wearable items; solid block":"block",
  "solid, plants":"block",
  "non-solid; plants":"empty"
};
function blockInfobox(page,cb)
{
  wikiTextParser.getArticle(page,function(err,data){
    var sectionObject=wikiTextParser.pageToSectionObject(data);

    var infoBox=wikiTextParser.parseInfoBox(sectionObject["content"]);
    var values=infoBox["values"];

    if(values["type"] && !(values["type"].trim().toLowerCase() in wikitypeToBoundingBox))
      console.log(page+" : "+values["type"]);

    var outputData={
      "id":parseInt(values["data"]),
      "displayName":page,
      "stackSize":infobox_field_parser.parseStackable(values["stackable"]),
      "name":page.toLowerCase(),
      //TODO: to fix by properly parsing the tool (break for http://minecraft.gamepedia.com/Water)
      "diggable":values["tool"] ? values["tool"] != "N/A" : null,
      "boundingBox" : values["type"] && values["type"].trim().toLowerCase() in wikitypeToBoundingBox ? wikitypeToBoundingBox[values["type"].trim().toLowerCase()] : null
    };
    cb(null,outputData);
  });
}

function testStone()
{
  blockInfobox("Stone",function(err,data){
    console.log(data);
  });
}
function testAir()
{
  blockInfobox("Air",function(err,data){
    console.log(data);
  });
}

function blocksToFullBlocks(blocks,cb)
{
  async.map(blocks,function(block,cb){
    blockInfobox(block["link"],function(err,data){
      cb(null,{
        "id":block["id"],
        "displayName":block["displayName"],
        "stackSize":data!=null && "stackSize" in data ? data["stackSize"] : null,
        "name":block["name"],
        "diggable": data["diggable"],
        "boundingBox": data["boundingBox"]
      });
    });
  },function(err,results){
    cb(null,results);
  });
}

function writeAllBlocks()
{
  async.waterfall([
      function(cb){id_table_parser.parseDataValues("Data_values/Block_IDs",cb)},
      //function(blocks,cb){cb(null,blocks.slice(0,10))},
      blocksToFullBlocks
    ],
    function(err,fullBlocks){
      var blocks={};
      for(var i in fullBlocks)
      {
        blocks[fullBlocks[i]["id"]]=fullBlocks[i];
      }
      console.log(blocks);
      //fs.writeFile("../../enums/blocks.json", JSON.stringify(items,null,2));
    });
}

writeAllBlocks();
//testAir();
//testStone();
/*id_table_parser.parseDataValues("Data_values/Block_IDs",function(err,blocks){
  console.log(blocks);
});*/


// not used after all
function recipeQuery()
{
  wikiTextParser.dplQuery(
    '{{#dpl:categorymatch=%recipe' +
    "|include={Crafting}:1:2:3:4:5:6:7:8:9:A1:B1:C1:A2:B2:C2:A3:B3:C3:Output" +
    "|mode = userformat" +
    "|secseparators = ====" +
    "|multisecseparators = ====" +
    "}}",
    function (err,info) {
      console.log(info.split("===="));
    }
  );
}

// doesn't get all the information : limited
function blockQuery()
{
  wikiTextParser.dplQuery(
    '{{#dpl:category=Natural_blocks' +
    "|include={Block}:data:nameid:type:tntres" +
    "|mode = userformat" +
    "|secseparators = ====" +
    "|multisecseparators = ====" +
    "}}",
    function (err,info) {
      console.log(info.split("\n")[0].split("===="));
    }
  );
}

function getBlocks()
{
  wikiTextParser.getArticle("Blocks",function(err,data){
    var sectionObject=wikiTextParser.pageToSectionObject(data);

    var overworldNaturallyGenerated=sectionObject["World-generated blocks"]["The Overworld"]["Naturally generated"]["content"];
    var table=wikiTextParser.parseTable(overworldNaturallyGenerated);
    var linkTable=table.map(function(values){return values[2];});
    console.log(linkTable);
  });
}