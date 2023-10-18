<script>
	// import Render from './webgl/index.js';
	import DoubleRangeSlider from './DoubleRangeSlider.svelte';
	import { _userInfo } from "./stores.js";
	import { onMount, tick } from 'svelte';
// import * as geokeysToProj4 from "geotiff-geokeys-to-proj4";
// import proj4 from "proj4";

// import GeoTIFF, { fromUrl, fromUrls, fromArrayBuffer, fromBlob } from '/thirdparty/geotiff/geotiff.js';
// import GeoTIFF from 'geotiff';
// console.log('GeoTIFF_______', geokeysToProj4);

	export let params;
	let {
		LayerID = undefined, contrast = 0, brightness = 0,
		saturation = 0, hue = 0,
		desaturate = false, negative = false, desaturateLuminance = false, sepia = false, brownie = false,
		vintagePinhole = false, kodachrome = false, technicolor = false, polaroid = false, shiftToBGR = false,
		detectedges = false, sobelx = false, sobely = false, sharpen = 1, emboss = 1,
		rzam = '0', gzam = '1', bzam = '2',
		startRed = 0, endRed = 1, startGreen = 0, endGreen = 1, startBlue = 0, endBlue = 1
	} = params ? params : {};

	let rgbh, rgbzam, test, flagDownAll,
		startAllCol = 0, endAllCol = 1;
	// let isMount = false, curLayer, lProps, tileRender = new Render();
	let isMount = false, curLayer, lProps, tileRender;
	let _layersTree = self.nsGmx?._layersTree || window._layersTree;
	let userInfo;

	_userInfo.subscribe(value => userInfo = value);
	const _glWorker = window.nsGmx.glWorker;

$: {
	// if(curLayer) {
		test = contrast + brightness + saturation + hue + desaturate + negative + desaturateLuminance +
			sepia + brownie + vintagePinhole + kodachrome + technicolor + polaroid + shiftToBGR +
			detectedges + sobelx + sobely + sharpen + emboss;
		if (startRed > endRed) startRed = endRed;
		else if (endRed < startRed) endRed = startRed;
		rgbh = {
			r:{min: startRed, max: endRed},
			g:{min: startGreen, max: endGreen},
			b:{min: startBlue, max: endBlue}
		};
		rgbzam = {
			r: Number(rzam),
			g: Number(gzam),
			b: Number(bzam)
		};
		repaint();
	// }
}
$: {
	if(flagDownAll) {
		startRed = startGreen = startBlue = startAllCol;
		endRed = endGreen = endBlue = endAllCol;
	}
}

	const nice = d => {
		if (!d && d !== 0) return '';
		return d.toFixed(2);
	};

	const repaint = () => {
// console.log(' ___ repaint ____', _glWorker, nsGmx.libGL);
		
		if (curLayer) {
			curLayer.repaint();
			params.LayerID = LayerID;
			params.contrast = contrast; params.brightness = brightness;
			params.rzam = rzam; params.gzam = gzam; params.bzam = bzam;
			params.startRed = startRed; params.endRed = endRed;
			params.startGreen = startGreen; params.endGreen = endGreen;
			params.startBlue = startBlue; params.endBlue = endBlue;
		} else {
			nsGmx.libGL.setParams({
				cmd: 'ImageFilters',
				filters: {
					contrast, brightness,
					saturation, hue,
					desaturate, negative, desaturateLuminance,
					sepia, brownie, vintagePinhole, kodachrome, technicolor, polaroid, shiftToBGR,
detectedges, sobelx, sobely, sharpen, emboss,
					rzam, gzam, bzam,
					startRed, endRed, startGreen, endGreen, startBlue, endBlue
				}
			});
			// _glWorker.sendCmd({
				// cmd: 'ImageFilters',
				// filters: {
					// contrast, brightness,
					// rzam, gzam, bzam,
					// startRed, endRed, startGreen, endGreen, startBlue, endBlue
				// }
			// });
		}
	};

	const rasterHook = (dstCanvas, canvas, sx, sy, sw, sh, dx, dy, dw, dh, info) => {
		tileRender.addFilter('brightness', brightness);
		tileRender.addFilter('contrast', contrast);
		tileRender.addFilter('rgb', rgbh);
		tileRender.addFilter('rgbzam', rgbzam);
		
		const filteredImage = tileRender.apply(canvas);
		var ptx = dstCanvas.getContext('2d');
		ptx.drawImage(filteredImage, sx, sy, sw, sh, dx, dy, dw, dh);
		tileRender.reset();
		return dstCanvas;
	};

	const reSetData = () => {
		startAllCol = 0; endAllCol = 1; brightness = 0; contrast = 0; rzam = '0'; gzam = '1'; bzam = '2'; startRed = 0;
		endRed = 1; startGreen = 0; endGreen = 1; startBlue = 0; endBlue = 1;
		if (curLayer) {
			Object.entries(lProps.MetaProperties).forEach(([k, v]) => {
				switch (k) {
					case 'brightness':
						brightness = Number(v.Value);
						break;
					case 'contrast':
						contrast = Number(v.Value);
						break;
					case 'rzam':
						rzam = v.Value;
						break;
					case 'gzam':
						gzam = v.Value;
						break;
					case 'bzam':
						bzam = v.Value;
						break;
					case 'startRed':
						startRed = Number(v.Value);
						break;
					case 'endRed':
						endRed = Number(v.Value);
						break;
					case 'startGreen':
						startGreen = Number(v.Value);
						break;
					case 'endGreen':
						endGreen = Number(v.Value);
						break;
					case 'startBlue':
						startBlue = Number(v.Value);
						break;
					case 'endBlue':
						endBlue = Number(v.Value);
						break;
					default:
						break;
				}
			});
			repaint();
		}
	};
	const setLayer = (layer, notReset) => {
		curLayer = layer;
		lProps = curLayer.getGmxProperties();
		const map = nsGmx.leafletMap;
		if(!notReset) {
			reSetData();
			map.fitBounds(curLayer.getBounds());
		};
		curLayer.setRasterHook(rasterHook);
		map.addLayer(curLayer);
	};
	const viewLayer = (id, notReset) => {
		if (id) {
			LayerID = id;
			let elem = _layersTree.treeModel.findElem('name', id);
			if (!elem) {
				_layersTree.addLayerToTree(id);
				nsGmx.leafletMap.once('layeradd', (ev) => { setLayer(ev.layer, notReset); });
			} else {
				setLayer(nsGmx.gmxMap.layersByID[id], notReset);
			}
		}
	};

	const selLayer = () => {
		const dialog = nsGmx.Utils.showLayersTable(
			{
				enableClickOnDisabledLayers: true,
				fixType: 'raster',
				onclick: (it) => {
					// nsGmx.Utils.removeDialog(dialog);
					// L.Util.requestAnimFrame(() => { nsGmx.Utils.removeDialog(dialog); });
					viewLayer(it.elem.LayerID);
				}
			}
		);
	};

	const saveLayer = async () => {
		let MetaProperties = lProps?.MetaProperties || {};

		// todo: dry the code
		if (rzam !== MetaProperties?.rzam?.Value) MetaProperties = {...MetaProperties, rzam: {"Value":`${rzam}`,"Type":"String"}};
		if (gzam !== MetaProperties?.gzam?.Value) MetaProperties = {...MetaProperties, gzam: {"Value":`${gzam}`,"Type":"String"}};
		if (bzam !== MetaProperties?.bzam?.Value) MetaProperties = {...MetaProperties, bzam: {"Value":`${bzam}`,"Type":"String"}};

		if (contrast !== Number(MetaProperties?.contrast?.Value)) MetaProperties = {...MetaProperties, contrast: {"Value":`${contrast}`,"Type":"String"}};
		if (brightness !== Number(MetaProperties?.brightness?.Value)) MetaProperties = {...MetaProperties, brightness: {"Value":`${brightness}`,"Type":"String"}};

		if (startRed !== Number(MetaProperties?.startRed?.Value).toFixed(2)) MetaProperties = {...MetaProperties, startRed: {"Value":`${startRed.toFixed(2)}`,"Type":"String"}};
		if (endRed !== Number(MetaProperties?.endRed?.Value).toFixed(2)) MetaProperties = {...MetaProperties, endRed: {"Value":`${endRed.toFixed(2)}`,"Type":"String"}};
		if (startGreen !== Number(MetaProperties?.startGreen?.Value).toFixed(2)) MetaProperties = {...MetaProperties, startGreen: {"Value":`${startGreen.toFixed(2)}`,"Type":"String"}};
		if (endGreen !== Number(MetaProperties?.endGreen?.Value).toFixed(2)) MetaProperties = {...MetaProperties, endGreen: {"Value":`${endGreen.toFixed(2)}`,"Type":"String"}};
		if (startBlue !== Number(MetaProperties?.startBlue?.Value).toFixed(2)) MetaProperties = {...MetaProperties, startBlue: {"Value":`${startBlue.toFixed(2)}`,"Type":"String"}};
		if (endBlue !== Number(MetaProperties?.endBlue?.Value).toFixed(2)) MetaProperties = {...MetaProperties, endBlue: {"Value":`${endBlue.toFixed(2)}`,"Type":"String"}};

		let RasterLayerID = lProps.LayerID;
		let data = await nsGmx.Utils.postJson({pars: {
			RasterLayerID,
			GeometryChanged: false,
			MetaProperties: JSON.stringify(MetaProperties)
		}, cmd: 'Update', ext: '.ashx', path: 'RasterLayer'});
		
		if (data?.TaskID) {
			const res = await nsGmx.Utils.asyncTask(data.TaskID);
			if (res?.properties) {
				nsGmx.Utils.notification.view('Изменения сохранены', 'info');
				if (!_layersTree.treeModel.findElem('name', RasterLayerID)) _layersTree.addLayerToTree(RasterLayerID);
			}
		}
	}
	onMount(() => {
		repaint();
		// if (params.LayerID) viewLayer(params.LayerID, true);
	});

	const selFile = async (ev) => {
		const file = ev.target.files[0];
		
		const reader = new FileReader();
		reader.onload = (evt) => {
			const tiff = evt.target.result;
			console.log('gggggggg', tiff);
			nsGmx.tiffWorker.sendCmd({
				tiff 
			}, [tiff]).then(res => {
			// }).then(res => {
	console.log('rasterHook ', res);
			});

		};
		reader.readAsArrayBuffer(file);
		return;

  const GeoTIFF = self.GeoTIFF;

		const tiff = await GeoTIFF.fromBlob(file);
		const imageCount = await tiff.getImageCount();
		const image = await tiff.getImage(); // by default, the first image is read.
// const pool = new GeoTIFF.Pool();
// const data = await image.readRasters({ pool });
		// const data = await image.readRasters();
		// const [red, green, blue] = await image.readRasters();
// const [r0, g0, b0, r1, g1, b1] = await image.readRasters({ pool, interleave: true });
		// const { width, height } = data;
// const rgb = await image.readRGB({
  // options...
// });
		const tiffAttr = {
			imageCount,
			images: [
				{
					width: image.getWidth(),
					height: image.getHeight(),
					tileWidth: image.getTileWidth(),
					tileHeight: image.getTileHeight(),
					samplesPerPixel: image.getSamplesPerPixel(),

				// when we are actually dealing with geo-data the following methods return
				// meaningful results:
					// origin: image.getOrigin(), // Error in getOrigin. When the image has no affine transformation
					// resolution: image.getResolution(),
					// bbox: image.getBoundingBox(),
					raster: {
						// red, green, blue
					},
					// rgb
				}
			]
		};
		nsGmx.glWorker.sendCmd({
			tiffAttr
			// }, bitmapOne).then(res => {
		}).then(res => {
console.log('rasterHook ', res);
		});

console.log('selFile_______', tiffAttr, image);
	};

	let tifFile;
	const selTifFile = async (ev) => {
console.log('tifFile', tifFile);
		nsGmx.tiffWorker.sendCmd({
			cmd: 'getTif',
			src: tifFile
		}).then(res => {
console.log('rasterHook ', res);
		});
	};

</script>
<section class="WebGLfilters">
	<div class="header">Гистограмма Tiff файла</div>
	<section class="blockLine scrollbar">
		<div class="line">
			<span class="title">Выбрать Tiff</span>
			<select bind:value={tifFile} on:change={selTifFile}>
			  <option hidden>Выбрать файл</option>
			  <option value='/data/B_RGB.tif'>B_RGB.tif</option>
			  <option value='/data/N29E095.tif'>N29E095.tif</option>
			  <option value='/data/20211205005330_NRT_RUMO_RS2_940127_1_SCWA_ICE_HH_w.tif'>20211205005330_NRT_RUMO_RS2_940127_1_SCWA_ICE_HH_w.tif</option>
			  <option value='/data/B05.tif'>B05.tif</option>
			  <option value='/data/Карта_тестовых_слоёв_mail.ru.tiff'>Карта_тестовых_слоёв_mail.ru.tiff</option>
			</select>
		</div>
		<input type="file" on:change={selFile} />
		<button class="choose" on:click={selLayer}>Выбрать растр</button>
		<span class="grey">Выбран растр</span>
		<textarea name="" readonly={true} class="rasterText">{lProps?.title || ''}</textarea>

<details>
	<summary>Задать соответствие каналов</summary>
	<div class="selectDiv">
		<span>Красный</span>
		<select bind:value={rzam}>
		  <option value='0' selected>Канал 1</option>
		  <option value='1'>Канал 2</option>
		  <option value='2'>Канал 3</option>
		</select>
	</div>
	<div class="selectDiv">
		<span>Зеленый</span>
		<select bind:value={gzam}>
		  <option value='0'>Канал 1</option>
		  <option value='1' selected>Канал 2</option>
		  <option value='2'>Канал 3</option>
		</select>
	</div>
	<div class="selectDiv">
		<span>Синий</span>
		<select bind:value={bzam}>
		  <option value='0'>Канал 1</option>
		  <option value='1'>Канал 2</option>
		  <option value='2' selected>Канал 3</option>
		</select>
	</div>
</details>
<details>
	<summary>Параметры гистограммы</summary>
	<div class="rangerWrap">
		<span class="sliderTitle">Контраст: {contrast}</span>
		<span class="spanWrap">
			<div class="labels">
				<div>-1</div>
			</div>
			<div class="sliderWrap">
				<input class="inputType" type="range" min=-1 max=1 bind:value={contrast} step=0.01 />
			</div>
			<div class="labels">
				<div>1</div>
			</div>
		</span>
	</div>

	<div class="rangerWrap">
		<span class="sliderTitle">Яркость: {brightness}</span>
		<span class="spanWrap">
			<div class="labels">
				<div>-1</div>
			</div>
			<div class="sliderWrap">
				<input class="inputType" type="range" min=-1 max=1 bind:value={brightness} step=0.01 />
			</div>
			<div class="labels">
				<div>1</div>
			</div>
		</span>
	</div>
</details>

<details>
	<summary>Каналы</summary>
	<div class="rangerWrap">
		<span class="sliderTitle">Красный</span>
		<span class="spanWrap">
			<div class="labels">
				<div class="label">{nice(startRed)}</div>
			</div>
			<div class="sliderWrap dbl">
				<input class="inputType dbl left" type="range" min="0" max=1 bind:value={startRed} step="0.01" />
				<!--div class="left" style="width:calc({100 * startRed}% - 0%);"></div -->
				<input class="inputType dbl right" type="range" min=0 max=1 bind:value={endRed} step=0.01 />
				<!--div class="right" style="width:calc({100 * (1 - endRed)}% - 7px);"></div -->
			</div>
			<div class="labels">
				<div class="label">{nice(endRed)}</div>
			</div>
		</span>
	</div>

	<div class="rangerWrap">
		<span class="sliderTitle">Зеленый</span>
		<span class="spanWrap">
			<div class="labels">
				<div class="label">{nice(startGreen)}</div>
			</div>
			<div class="sliderWrap">
				<DoubleRangeSlider bind:start = {startGreen} bind:end = {endGreen} />
			</div>
			<div class="labels">
				<div class="label">{nice(endGreen)}</div>
			</div>
		</span>
	</div>

	<div class="rangerWrap">
		<span class="sliderTitle">Синий</span>
		<span class="spanWrap">
			<div class="labels">
				<div class="label">{nice(startBlue)}</div>
			</div>
			<div class="sliderWrap">
				<DoubleRangeSlider bind:start = {startBlue} bind:end = {endBlue} />
			</div>
			<div class="labels">
				<div class="label">{nice(endBlue)}</div>
			</div>
		</span>
	</div>

	<div class="rangerWrap">
		<span class="localTitle">Все вместе</span>
		<span class="spanWrap">
			<div class="labels">
				<div class="label">{nice(startAllCol)}</div>
			</div>
			<div class="sliderWrap">
				<DoubleRangeSlider bind:start={startAllCol} bind:end={endAllCol} on:change={()=> flagDownAll = true} />
			</div>
			<div class="labels">
				<div class="label">{nice(endAllCol)}</div>
			</div>
		</span>
	</div>
</details>
<details>
	<summary>Оттенок/Насыщенность</summary>
	<div class="rangerWrap">
		<span class="sliderTitle">Насыщенность: {saturation}</span>
		<span class="spanWrap">
			<div class="labels">
				<div>-1</div>
			</div>
			<div class="sliderWrap">
				<input class="inputType" type="range" min=-1 max=1 bind:value={saturation} step=0.01 />
			</div>
			<div class="labels">
				<div>1</div>
			</div>
		</span>
	</div>
	<div class="rangerWrap">
		<span class="sliderTitle">Оттенок: {hue}</span>
		<span class="spanWrap">
			<div class="labels">
				<div>-1</div>
			</div>
			<div class="sliderWrap">
				<input class="inputType" type="range" min=-1 max=1 bind:value={hue} step=0.01 />
			</div>
			<div class="labels">
				<div>1</div>
			</div>
		</span>
	</div>
</details>
<details>
	<summary>desaturate/negative</summary>
	<input class="checkbox" type="checkbox" bind:checked={desaturate} /><label class="label">- включить desaturate</label><br />
	<input class="checkbox" type="checkbox" bind:checked={negative} /><label class="label">- включить negative</label><br />
	<input class="checkbox" type="checkbox" bind:checked={desaturateLuminance} /><label class="label">- включить desaturateLuminance</label><br />
	<input class="checkbox" type="checkbox" bind:checked={sepia} /><label class="label">- включить sepia</label><br />
	<input class="checkbox" type="checkbox" bind:checked={brownie} /><label class="label">- включить brownie</label><br />
	<input class="checkbox" type="checkbox" bind:checked={vintagePinhole} /><label class="label">- включить vintagePinhole</label><br />
	<input class="checkbox" type="checkbox" bind:checked={kodachrome} /><label class="label">- включить kodachrome</label><br />
	<input class="checkbox" type="checkbox" bind:checked={technicolor} /><label class="label">- включить technicolor</label><br />
	<input class="checkbox" type="checkbox" bind:checked={polaroid} /><label class="label">- включить polaroid</label><br />
	<input class="checkbox" type="checkbox" bind:checked={shiftToBGR} /><label class="label">- включить shiftToBGR</label>
</details>
<!-- details open>
	<summary>Convolution</summary>
	<input class="checkbox" type="checkbox" bind:checked={detectedges} /><label class="label">- включить detectedges</label><br />
	<input class="checkbox" type="checkbox" bind:checked={sobelx} /><label class="label">- включить sobelx</label><br />
	<input class="checkbox" type="checkbox" bind:checked={sobely} /><label class="label">- включить sobely</label><br />
	<div class="rangerWrap">
		<span class="sliderTitle">sharpen: {sharpen}</span>
		<span class="spanWrap">
			<div class="labels">
				<div>-1</div>
			</div>
			<div class="sliderWrap">
				<input class="inputType" type="range" min=-1 max=1 bind:value={sharpen} step=0.01 />
			</div>
			<div class="labels">
				<div>1</div>
			</div>
		</span>
	</div>
	<div class="rangerWrap">
		<span class="sliderTitle">emboss: {emboss}</span>
		<span class="spanWrap">
			<div class="labels">
				<div>-1</div>
			</div>
			<div class="sliderWrap">
				<input class="inputType" type="range" min=-1 max=1 bind:value={emboss} step=0.01 />
			</div>
			<div class="labels">
				<div>1</div>
			</div>
		</span>
	</div>
</details -->

	</section>
	<div class="buttonWrapper">
			<button class="mainButton cancel" on:click={() => {reSetData();}}>Отменить</button>
			<button class="mainButton save" disabled={!curLayer ? true : false} on:click={saveLayer}>Сохранить</button>
	</div>
</section>
<style>
	:global(#all) {
		width: 100vh;
		height: 100vh;
	    /*overflow: hidden;*/
		
	}
	:global(.leftMenu) {
		    position: absolute;
		top: 0;
		
	}
	:global(body #all .leaflet-container) {
		position: relative;
	}
	:global(.map) {
			position: relative;
		top: 0;
		left: 400px;
		height: 100%;		
	}
	section.WebGLfilters {
		height: 100vh;
		    max-width: 360px;
		/* display: flex; */
		/* flex-direction: column; */
		padding: 0 10px;
		line-height: 30px;
    display: grid;
    grid-template-rows: 30px calc(100% - 100px) 50px;

	}
	.header {
		text-align: center;
		font-weight: bold;
	}

	.blockLine  {
		overflow-y: auto;
	}
.scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 8px;
  background-color: #aaa;
}
.scrollbar::-webkit-scrollbar-thumb {
  background-color: #686b8494;
}

details	summary {
	font-weight: bold;
	cursor: pointer;
}

input.dbl + div {
	pointer-events: none;
	top: 7px;
	position: absolute;
  background-color: red;
  height: 4px;
      z-index: 1;
	      background-color: gainsboro;
}
input.dbl.right + div {
  right: -2px;
}
details	input.dbl.left div {
	background-color: red;
	display: block;
}

input.dbl.left::after {
	background-color: red;
	display: block;
}
details	input.dbl::-webkit-slider-runnable-thumb {
	background: red;
}
details	input.dbl.left::-webkit-slider-runnable-track {
	  /* background-color: red; */
}
details	input.dbl.right {

}

	.line {
	}
	.buttonWrapper {
		    text-align: center;
		/* display: flex; */
		/* margin-top: 20px; */
		/* justify-content:space-around; */
	}
	.buttonWrapper button {
		width: 40%;
		height: 50px;
		border-radius: 5px;
		border-style: none;
		cursor: pointer;
		color: white;
	}

	.buttonWrapper button.cancel {
		background-color: #d27a81;
	}

	.buttonWrapper button.save {
		background-color: #82A0D8;
	}

	.rangerWrap {
		display: flex;
		justify-content: space-between;
		margin-top: 10px;
	}

	.sliderTitle {
		align-self: left;
		width: 30%;
	}

	.spanWrap {
		display: flex;
		width: 70%;
		gap: 10px;
	}

	.sliderWrap {
    position: relative;
		width: 100%;
		line-height: 8px;
	}

	.inputType {
/*		-webkit-appearance: none;
*/
		appearance: none;
		width: 100%;
		background-color: blue;
		height: 3px;
	}

	.selectDiv {
		margin-top: 10px;
		display: flex;
		justify-content: space-between;
	}

	select {
		width: 50%;
	}
	/* #histogram {
		height: 100%;
	} */

	.localTitle {
		font-weight: bold;
	}

	.choose {
		width: 90%;
		height: 30px;
		border-radius: 5px;
		border-style: none;
		/* background-color: #0E21A0;82A0D8 */
		background-color: #82A0D8;
		color: white;
		cursor: pointer;
	}
	.grey {
		margin-top: 10px;
		color: grey;
	}
	.rasterText {
		width: 90%;
		width: 90%;
		height: 50px;
		margin-top: 10px;
		resize: none;
	}
</style>