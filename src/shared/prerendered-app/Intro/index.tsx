import { h, Component } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import '../../custom-els/loading-spinner';
import logo from 'url:./imgs/logo.svg';
import githubLogo from 'url:./imgs/github-logo.svg';
import largePhoto from 'url:./imgs/demos/demo-large-photo.jpg';
import artwork from 'url:./imgs/demos/demo-artwork.jpg';
import deviceScreen from 'url:./imgs/demos/demo-device-screen.png';
import largePhotoIcon from 'url:./imgs/demos/icon-demo-large-photo.jpg';
import artworkIcon from 'url:./imgs/demos/icon-demo-artwork.jpg';
import deviceScreenIcon from 'url:./imgs/demos/icon-demo-device-screen.jpg';
import smallSectionAsset from 'url:./imgs/info-content/small.svg';
import simpleSectionAsset from 'url:./imgs/info-content/simple.svg';
import secureSectionAsset from 'url:./imgs/info-content/secure.svg';
import logoIcon from 'url:./imgs/demos/icon-demo-logo.png';
import logoWithText from 'data-url-text:./imgs/logo-with-text.svg';
import * as style from './style.css';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import 'shared/custom-els/snack-bar';
import { startBlobs } from './blob-anim/meta';
import SlideOnScroll from './SlideOnScroll';

const demos = [
  {
    description: 'Large photo',
    size: '2.8mb',
    filename: 'photo.jpg',
    url: largePhoto,
    iconUrl: largePhotoIcon,
  },
  {
    description: 'Artwork',
    size: '2.9mb',
    filename: 'art.jpg',
    url: artwork,
    iconUrl: artworkIcon,
  },
  {
    description: 'Device screen',
    size: '1.6mb',
    filename: 'pixel3.png',
    url: deviceScreen,
    iconUrl: deviceScreenIcon,
  },
  // {
  //   description: 'SVG icon',
  //   size: '13k',
  //   filename: 'squoosh.svg',
  //   url: logo,
  //   iconUrl: logoIcon,
  // },
] as const;

const blobAnimImport =
  !__PRERENDER__ && matchMedia('(prefers-reduced-motion: reduce)').matches
    ? undefined
    : import('./blob-anim');
const installButtonSource = 'introInstallButton-Purple';
const supportsClipboardAPI =
  !__PRERENDER__ && navigator.clipboard && navigator.clipboard.read;

async function getImageClipboardItem(
  items: ClipboardItem[],
): Promise<undefined | Blob> {
  for (const item of items) {
    const type = item.types.find((type) => type.startsWith('image/'));
    if (type) return item.getType(type);
  }
}

interface Props {
  onFile?: (file: File) => void;
  showSnack?: SnackBarElement['showSnackbar'];
}
interface State {
  fetchingDemoIndex?: number;
  beforeInstallEvent?: BeforeInstallPromptEvent;
  showBlobSVG: boolean;
}

export default class Intro extends Component<Props, State> {
  state: State = {
    showBlobSVG: true,
  };
  private fileInput?: HTMLInputElement;
  private blobCanvas?: HTMLCanvasElement;
  private installingViaButton = false;

  componentDidMount() {
    // Listen for beforeinstallprompt events, indicating Squoosh is installable.
    window.addEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );

    // Listen for the appinstalled event, indicating Squoosh has been installed.
    window.addEventListener('appinstalled', this.onAppInstalled);

    if (blobAnimImport) {
      blobAnimImport.then((module) => {
        this.setState(
          {
            showBlobSVG: false,
          },
          () => module.startBlobAnim(this.blobCanvas!),
        );
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );
    window.removeEventListener('appinstalled', this.onAppInstalled);
  }

  private onFileChange = (event: Event): void => {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    this.fileInput!.value = '';
    this.props.onFile!(file);
  };

  private onOpenClick = () => {
    this.fileInput!.click();
  };

  private onDemoClick = async (index: number, event: Event) => {
    try {
      this.setState({ fetchingDemoIndex: index });
      const demo = demos[index];
      const blob = await fetch(demo.url).then((r) => r.blob());
      const file = new File([blob], demo.filename, { type: blob.type });
      this.props.onFile!(file);
    } catch (err) {
      this.setState({ fetchingDemoIndex: undefined });
      this.props.showSnack!("Couldn't fetch demo image");
    }
  };

  private onBeforeInstallPromptEvent = (event: BeforeInstallPromptEvent) => {
    // Don't show the mini-infobar on mobile
    event.preventDefault();

    // Save the beforeinstallprompt event so it can be called later.
    this.setState({ beforeInstallEvent: event });

    // Log the event.
    const gaEventInfo = {
      eventCategory: 'pwa-install',
      eventAction: 'promo-shown',
      nonInteraction: true,
    };
    ga('send', 'event', gaEventInfo);
  };

  private onAppInstalled = () => {
    // We don't need the install button, if it's shown
    this.setState({ beforeInstallEvent: undefined });

    // Don't log analytics if page is not visible
    if (document.hidden) return;

    // Try to get the install, if it's not set, use 'browser'
    const source = this.installingViaButton ? installButtonSource : 'browser';
    ga('send', 'event', 'pwa-install', 'installed', source);

    // Clear the install method property
    this.installingViaButton = false;
  };

  private onPasteClick = async () => {
    let clipboardItems: ClipboardItem[];

    try {
      clipboardItems = await navigator.clipboard.read();
    } catch (err) {
      this.props.showSnack!(`No permission to access clipboard`);
      return;
    }

    const blob = await getImageClipboardItem(clipboardItems);

    if (!blob) {
      this.props.showSnack!(`No image found in the clipboard`);
      return;
    }

    this.props.onFile!(new File([blob], 'image.unknown'));
  };

  render(
    {}: Props,
    { fetchingDemoIndex, beforeInstallEvent, showBlobSVG }: State,
  ) {
    return (
      <div class={style.intro}>
        <input
          class={style.hide}
          ref={linkRef(this, 'fileInput')}
          type="file"
          onChange={this.onFileChange}
        />
        <div
          style={{
            paddingTop: '20px',
            marginTop: 0,
            textAlign: 'center',
            fontSize: '1.4em',
          }}
        >
          制图机单图片处理引擎无需登录，不上传图片到服务器，请放心使用
          <p style={{ fontSize: '0.8em', mb: 0, pb: 0 }}>
            本引擎提供智能压缩、尺寸调整与格式转换功能，如需更多处理功能、多图片批量处理和图片工作流，请登录或注册帐号后使用
          </p>
          <p style={{ fontSize: '0.8em', mb: 0, pb: 0 }}>
            图片在浏览器中处理，性能由您的PC配置决定
          </p>
        </div>

        <div class={style.main}>
          {!__PRERENDER__ && (
            <canvas
              ref={linkRef(this, 'blobCanvas')}
              class={style.blobCanvas}
            />
          )}
          <div class={style.loadImg}>
            {showBlobSVG && (
              <svg
                class={style.blobSvg}
                viewBox="-1.25 -1.25 2.5 2.5"
                preserveAspectRatio="xMidYMid slice"
              >
                {startBlobs.map((points) => (
                  <path
                    d={points
                      .map((point, i) => {
                        const nextI = i === points.length - 1 ? 0 : i + 1;
                        let d = '';
                        if (i === 0) {
                          d += `M${point[2]} ${point[3]}`;
                        }
                        return (
                          d +
                          `C${point[4]} ${point[5]} ${points[nextI][0]} ${points[nextI][1]} ${points[nextI][2]} ${points[nextI][3]}`
                        );
                      })
                      .join('')}
                  />
                ))}
              </svg>
            )}
            <div
              class={style.loadImgContent}
              style={{ visibility: __PRERENDER__ ? 'hidden' : '' }}
            >
              <button class={style.loadBtn} onClick={this.onOpenClick}>
                <svg viewBox="0 0 24 24" class={style.loadIcon}>
                  <path d="M19 7v3h-2V7h-3V5h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5a2 2 0 00-2 2v12c0 1.1.9 2 2 2h12a2 2 0 002-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z" />
                </svg>
              </button>
              <div>
                <span class={style.dropText}>拖拽 </span>或{' '}
                {supportsClipboardAPI ? (
                  <button class={style.pasteBtn} onClick={this.onPasteClick}>
                    粘帖
                  </button>
                ) : (
                  '粘帖'
                )}
              </div>
            </div>
          </div>
        </div>
        <div class={style.demosContainer}>
          <svg viewBox="0 0 1920 140" class={style.topWave}>
            <path
              d="M1920 0l-107 28c-106 29-320 85-533 93-213 7-427-36-640-50s-427 0-533 7L0 85v171h1920z"
              class={style.subWave}
            />
            <path
              d="M0 129l64-26c64-27 192-81 320-75 128 5 256 69 384 64 128-6 256-80 384-91s256 43 384 70c128 26 256 26 320 26h64v96H0z"
              class={style.mainWave}
            />
          </svg>
          <div class={style.contentPadding}>
            <p class={style.demoTitle}>或直接使用以下图片体验:</p>
            <ul class={style.demos}>
              {demos.map((demo, i) => (
                <li>
                  <button
                    class="unbutton"
                    onClick={(event) => this.onDemoClick(i, event)}
                  >
                    <div>
                      <div class={style.demoIconContainer}>
                        <img
                          class={style.demoIcon}
                          src={demo.iconUrl}
                          alt={demo.description}
                        />
                        {fetchingDemoIndex === i && (
                          <div class={style.demoLoader}>
                            <loading-spinner />
                          </div>
                        )}
                      </div>
                      <div class={style.demoSize}>{demo.size}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div class={style.bottomWave}>
          <svg viewBox="0 0 1920 79" class={style.topWave}>
            <path
              d="M0 59l64-11c64-11 192-34 320-43s256-5 384 4 256 23 384 34 256 21 384 14 256-30 320-41l64-11v94H0z"
              class={style.infoWave}
            />
          </svg>
        </div>
      </div>
    );
  }
}
