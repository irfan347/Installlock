'use strict';
// Paymint - single-file build (backend + embedded dashboard). Zero dependencies.
// Run: node --experimental-sqlite index.js
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const EMBEDDED_HTML = Buffer.from('PCFkb2N0eXBlIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CjxtZXRhIGNoYXJzZXQ9InV0Zi04IiAvPgo8bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEiIC8+Cjx0aXRsZT5QYXltaW50IOKAlCBEYXNoYm9hcmQ8L3RpdGxlPgo8c3R5bGU+CiAgOnJvb3R7CiAgICAtLWJnOiMwZjE0MjA7IC0tY2FyZDojMTcxZTJlOyAtLWNhcmQyOiMxZDI2Mzg7IC0tbGluZTojMmEzNDQ3OwogICAgLS10ZXh0OiNlOGVkZjY7IC0tbXV0ZWQ6IzlhYTdiZDsgLS1icmFuZDojNGY4Y2ZmOyAtLWJyYW5kMjojMmY2ZmUwOwogICAgLS1vazojMmZiZjcxOyAtLXdhcm46I2YyYTczYjsgLS1iYWQ6I2VmNWI1YjsgLS1yYWRpdXM6MTRweDsKICB9CiAgQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpewogICAgOnJvb3R7IC0tYmc6I2Y0ZjZmYjsgLS1jYXJkOiNmZmZmZmY7IC0tY2FyZDI6I2YwZjNmOTsgLS1saW5lOiNlMmU3ZjA7CiAgICAgIC0tdGV4dDojMTQxYjJiOyAtLW11dGVkOiM1YzY4ODA7IH0KICB9CiAgKntib3gtc2l6aW5nOmJvcmRlci1ib3h9CiAgYm9keXttYXJnaW46MDtmb250OjE1cHgvMS41IHN5c3RlbS11aSwtYXBwbGUtc3lzdGVtLCJTZWdvZSBVSSIsUm9ib3RvLHNhbnMtc2VyaWY7YmFja2dyb3VuZDp2YXIoLS1iZyk7Y29sb3I6dmFyKC0tdGV4dCl9CiAgaGVhZGVye2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjEycHg7cGFkZGluZzoxNHB4IDE4cHg7YmFja2dyb3VuZDp2YXIoLS1jYXJkKTtib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lKTtwb3NpdGlvbjpzdGlja3k7dG9wOjA7ei1pbmRleDo1fQogIGhlYWRlciAubG9nb3tmb250LXdlaWdodDo3MDA7Zm9udC1zaXplOjE4cHh9CiAgaGVhZGVyIC5sb2dvIHNwYW57Y29sb3I6dmFyKC0tYnJhbmQpfQogIGhlYWRlciAuc3BhY2Vye2ZsZXg6MX0KICBoZWFkZXIgLndob3tjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC1zaXplOjEzcHh9CiAgYnV0dG9ue2ZvbnQ6aW5oZXJpdDtjdXJzb3I6cG9pbnRlcjtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjEwcHg7cGFkZGluZzo5cHggMTRweDtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kKTtjb2xvcjojZmZmO2ZvbnQtd2VpZ2h0OjYwMH0KICBidXR0b24uZ2hvc3R7YmFja2dyb3VuZDp0cmFuc3BhcmVudDtjb2xvcjp2YXIoLS10ZXh0KTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpfQogIGJ1dHRvbi5va3tiYWNrZ3JvdW5kOnZhcigtLW9rKX0gYnV0dG9uLmJhZHtiYWNrZ3JvdW5kOnZhcigtLWJhZCl9IGJ1dHRvbi53YXJue2JhY2tncm91bmQ6dmFyKC0td2Fybik7Y29sb3I6IzIwMTUwMH0KICBidXR0b246ZGlzYWJsZWR7b3BhY2l0eTouNTtjdXJzb3I6bm90LWFsbG93ZWR9CiAgaW5wdXQsc2VsZWN0e2ZvbnQ6aW5oZXJpdDt3aWR0aDoxMDAlO3BhZGRpbmc6MTBweCAxMnB4O2JvcmRlci1yYWRpdXM6MTBweDtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JhY2tncm91bmQ6dmFyKC0tYmcpO2NvbG9yOnZhcigtLXRleHQpfQogIGxhYmVse2Rpc3BsYXk6YmxvY2s7Zm9udC1zaXplOjEzcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbjoxMHB4IDAgNHB4fQogIC53cmFwe21heC13aWR0aDoxMDUwcHg7bWFyZ2luOjAgYXV0bztwYWRkaW5nOjE4cHh9CiAgLnRhYnN7ZGlzcGxheTpmbGV4O2dhcDo4cHg7ZmxleC13cmFwOndyYXA7bWFyZ2luLWJvdHRvbToxNnB4fQogIC50YWJzIGJ1dHRvbntiYWNrZ3JvdW5kOnZhcigtLWNhcmQyKTtjb2xvcjp2YXIoLS10ZXh0KX0KICAudGFicyBidXR0b24uYWN0aXZle2JhY2tncm91bmQ6dmFyKC0tYnJhbmQpO2NvbG9yOiNmZmZ9CiAgLmNhcmR7YmFja2dyb3VuZDp2YXIoLS1jYXJkKTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tcmFkaXVzKTtwYWRkaW5nOjE2cHg7bWFyZ2luLWJvdHRvbToxNHB4fQogIC5ncmlke2Rpc3BsYXk6Z3JpZDtnYXA6MTJweDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KGF1dG8tZmlsbCxtaW5tYXgoMjYwcHgsMWZyKSl9CiAgLnJvd3tkaXNwbGF5OmZsZXg7Z2FwOjEwcHg7YWxpZ24taXRlbXM6Y2VudGVyO2ZsZXgtd3JhcDp3cmFwfQogIC5waWxse2ZvbnQtc2l6ZToxMnB4O3BhZGRpbmc6M3B4IDlweDtib3JkZXItcmFkaXVzOjk5OXB4O2ZvbnQtd2VpZ2h0OjYwMH0KICAucGlsbC5wZW5kaW5ne2JhY2tncm91bmQ6cmdiYSgyNDIsMTY3LDU5LC4xOCk7Y29sb3I6dmFyKC0td2Fybil9CiAgLnBpbGwuYWN0aXZle2JhY2tncm91bmQ6cmdiYSg0NywxOTEsMTEzLC4xOCk7Y29sb3I6dmFyKC0tb2spfQogIC5waWxsLnN1c3BlbmRlZCwucGlsbC5yZWplY3RlZHtiYWNrZ3JvdW5kOnJnYmEoMjM5LDkxLDkxLC4xOCk7Y29sb3I6dmFyKC0tYmFkKX0KICAucGlsbC5jb21wbGV0ZWR7YmFja2dyb3VuZDpyZ2JhKDc5LDE0MCwyNTUsLjE4KTtjb2xvcjp2YXIoLS1icmFuZCl9CiAgLnBpbGwubG9ja2Vke2JhY2tncm91bmQ6cmdiYSgyMzksOTEsOTEsLjIpO2NvbG9yOnZhcigtLWJhZCl9CiAgLm11dGVke2NvbG9yOnZhcigtLW11dGVkKX0gLnNtYWxse2ZvbnQtc2l6ZToxM3B4fQogIHRhYmxle3dpZHRoOjEwMCU7Ym9yZGVyLWNvbGxhcHNlOmNvbGxhcHNlfQogIHRoLHRke3RleHQtYWxpZ246bGVmdDtwYWRkaW5nOjhweCA2cHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZSk7Zm9udC1zaXplOjE0cHh9CiAgdGh7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtd2VpZ2h0OjYwMH0KICAudGh1bWJze2Rpc3BsYXk6ZmxleDtnYXA6OHB4fSAudGh1bWJzIGltZ3t3aWR0aDo2OHB4O2hlaWdodDo2OHB4O29iamVjdC1maXQ6Y292ZXI7Ym9yZGVyLXJhZGl1czo4cHg7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKX0KICAuY2VudGVye21pbi1oZWlnaHQ6NzB2aDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXJ9CiAgLmF1dGh7d2lkdGg6MzYwcHg7bWF4LXdpZHRoOjkydnd9CiAgLnRvYXN0e3Bvc2l0aW9uOmZpeGVkO2xlZnQ6NTAlO2JvdHRvbToyMnB4O3RyYW5zZm9ybTp0cmFuc2xhdGVYKC01MCUpO2JhY2tncm91bmQ6dmFyKC0tY2FyZDIpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7cGFkZGluZzoxMXB4IDE2cHg7Ym9yZGVyLXJhZGl1czoxMHB4O3otaW5kZXg6MzA7bWF4LXdpZHRoOjkwdnd9CiAgLnRvYXN0LmJhZHtib3JkZXItY29sb3I6dmFyKC0tYmFkKX0gLnRvYXN0Lm9re2JvcmRlci1jb2xvcjp2YXIoLS1vayl9CiAgLmtwaXtmb250LXNpemU6MjJweDtmb250LXdlaWdodDo3MDB9IC5rcGkuc21hbGx7Zm9udC1zaXplOjE2cHh9CiAgLmhpZGV7ZGlzcGxheTpub25lfQogIGRpYWxvZ3tib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOnZhcigtLXJhZGl1cyk7YmFja2dyb3VuZDp2YXIoLS1jYXJkKTtjb2xvcjp2YXIoLS10ZXh0KTttYXgtd2lkdGg6NTIwcHg7d2lkdGg6OTJ2dztwYWRkaW5nOjB9CiAgZGlhbG9nOjpiYWNrZHJvcHtiYWNrZ3JvdW5kOnJnYmEoMCwwLDAsLjUpfQogIC5kbGctaHtwYWRkaW5nOjE0cHggMTZweDtib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lKTtmb250LXdlaWdodDo3MDB9CiAgLmRsZy1ie3BhZGRpbmc6MTZweDttYXgtaGVpZ2h0Ojcwdmg7b3ZlcmZsb3c6YXV0b30gLmRsZy1me3BhZGRpbmc6MTJweCAxNnB4O2JvcmRlci10b3A6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2Rpc3BsYXk6ZmxleDtnYXA6OHB4O2p1c3RpZnktY29udGVudDpmbGV4LWVuZH0KICBhe2NvbG9yOnZhcigtLWJyYW5kKX0KPC9zdHlsZT4KPC9oZWFkPgo8Ym9keT4KPGRpdiBpZD0iYXBwIj48L2Rpdj4KPGRpdiBpZD0idG9hc3QiPjwvZGl2PgoKPHNjcmlwdD4KY29uc3QgQVBJID0gJyc7CmxldCBUT0tFTiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdpbF90b2tlbicpIHx8IG51bGw7CmxldCBNRSA9IG51bGw7CmxldCBUQUIgPSAnb3ZlcnZpZXcnOwoKLy8gLS0tLS0tLS0tLSBhcGkgLS0tLS0tLS0tLQphc3luYyBmdW5jdGlvbiBhcGkocGF0aCwgb3B0cz17fSl7CiAgY29uc3QgaGVhZGVycyA9IE9iamVjdC5hc3NpZ24oeydDb250ZW50LVR5cGUnOidhcHBsaWNhdGlvbi9qc29uJ30sIG9wdHMuaGVhZGVyc3x8e30pOwogIGlmIChUT0tFTikgaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gJ0JlYXJlciAnICsgVE9LRU47CiAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goQVBJICsgcGF0aCwgey4uLm9wdHMsIGhlYWRlcnN9KTsKICBsZXQgZGF0YSA9IHt9OyB0cnl7IGRhdGEgPSBhd2FpdCByZXMuanNvbigpOyB9Y2F0Y2h7fQogIGlmKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihkYXRhLmVycm9yIHx8ICgnSFRUUCAnK3Jlcy5zdGF0dXMpKTsKICByZXR1cm4gZGF0YTsKfQpmdW5jdGlvbiB0b2FzdChtc2csIGtpbmQ9JycpewogIGNvbnN0IHQ9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvYXN0Jyk7CiAgdC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0idG9hc3QgJytraW5kKyciPicrZXNjKG1zZykrJzwvZGl2Pic7CiAgc2V0VGltZW91dCgoKT0+e3QuaW5uZXJIVE1MPScnO30sIDMyMDApOwp9CmZ1bmN0aW9uIGVzYyhzKXtyZXR1cm4gU3RyaW5nKHM9PW51bGw/Jyc6cykucmVwbGFjZSgvWyY8PiJdL2csYz0+KHsnJic6JyZhbXA7JywnPCc6JyZsdDsnLCc+JzonJmd0OycsJyInOicmcXVvdDsnfVtjXSkpO30KZnVuY3Rpb24gbW9uZXkobil7cmV0dXJuICdScyAnICsgTnVtYmVyKG58fDApLnRvTG9jYWxlU3RyaW5nKCdlbi1QSycpO30KCi8vIC0tLS0tLS0tLS0gYXV0aCBzY3JlZW5zIC0tLS0tLS0tLS0KZnVuY3Rpb24gbG9naW5WaWV3KCl7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcCcpLmlubmVySFRNTCA9IGAKICA8ZGl2IGNsYXNzPSJjZW50ZXIiPjxkaXYgY2xhc3M9ImNhcmQgYXV0aCI+CiAgICA8ZGl2IGNsYXNzPSJsb2dvIiBzdHlsZT0iZm9udC1zaXplOjIycHg7Zm9udC13ZWlnaHQ6NzAwO21hcmdpbi1ib3R0b206NHB4Ij5QYXk8c3BhbiBzdHlsZT0iY29sb3I6dmFyKC0tYnJhbmQpIj5taW50PC9zcGFuPjwvZGl2PgogICAgPGRpdiBjbGFzcz0ibXV0ZWQgc21hbGwiIHN0eWxlPSJtYXJnaW4tYm90dG9tOjE0cHgiPlNob3BrZWVwZXIgJiBBZG1pbiBkYXNoYm9hcmQ8L2Rpdj4KICAgIDxkaXYgaWQ9ImF1dGhGb3JtcyI+PC9kaXY+CiAgPC9kaXY+PC9kaXY+YDsKICBzaG93TG9naW4oKTsKfQpmdW5jdGlvbiBzaG93TG9naW4oKXsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXV0aEZvcm1zJykuaW5uZXJIVE1MID0gYAogICAgPGxhYmVsPlBob25lPC9sYWJlbD48aW5wdXQgaWQ9ImxfcGhvbmUiIHBsYWNlaG9sZGVyPSIwM3h4eHh4eHh4eCIgLz4KICAgIDxsYWJlbD5QYXNzd29yZDwvbGFiZWw+PGlucHV0IGlkPSJsX3Bhc3MiIHR5cGU9InBhc3N3b3JkIiAvPgogICAgPGJ1dHRvbiBzdHlsZT0id2lkdGg6MTAwJTttYXJnaW4tdG9wOjE0cHgiIG9uY2xpY2s9ImRvTG9naW4oKSI+TG9naW48L2J1dHRvbj4KICAgIDxkaXYgY2xhc3M9InNtYWxsIG11dGVkIiBzdHlsZT0ibWFyZ2luLXRvcDoxMnB4Ij5OZXcgc2hvcGtlZXBlcj8gPGEgaHJlZj0iIyIgb25jbGljaz0ic2hvd1JlZygpO3JldHVybiBmYWxzZSI+Q3JlYXRlIGFuIGFjY291bnQ8L2E+PC9kaXY+YDsKfQpmdW5jdGlvbiBzaG93UmVnKCl7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dGhGb3JtcycpLmlubmVySFRNTCA9IGAKICAgIDxsYWJlbD5Zb3VyIG5hbWU8L2xhYmVsPjxpbnB1dCBpZD0icl9uYW1lIiAvPgogICAgPGxhYmVsPlNob3AgbmFtZTwvbGFiZWw+PGlucHV0IGlkPSJyX3Nob3AiIC8+CiAgICA8bGFiZWw+UGhvbmU8L2xhYmVsPjxpbnB1dCBpZD0icl9waG9uZSIgcGxhY2Vob2xkZXI9IjAzeHh4eHh4eHh4IiAvPgogICAgPGxhYmVsPlBhc3N3b3JkPC9sYWJlbD48aW5wdXQgaWQ9InJfcGFzcyIgdHlwZT0icGFzc3dvcmQiIC8+CiAgICA8YnV0dG9uIHN0eWxlPSJ3aWR0aDoxMDAlO21hcmdpbi10b3A6MTRweCIgb25jbGljaz0iZG9SZWcoKSI+Q3JlYXRlIGFjY291bnQ8L2J1dHRvbj4KICAgIDxkaXYgY2xhc3M9InNtYWxsIG11dGVkIiBzdHlsZT0ibWFyZ2luLXRvcDoxMHB4Ij5BY2NvdW50IGFjdGl2YXRlcyBhZnRlciBhZG1pbiBhcHByb3ZhbC48L2Rpdj4KICAgIDxkaXYgY2xhc3M9InNtYWxsIG11dGVkIiBzdHlsZT0ibWFyZ2luLXRvcDo4cHgiPjxhIGhyZWY9IiMiIG9uY2xpY2s9InNob3dMb2dpbigpO3JldHVybiBmYWxzZSI+QmFjayB0byBsb2dpbjwvYT48L2Rpdj5gOwp9CmFzeW5jIGZ1bmN0aW9uIGRvTG9naW4oKXsKICB0cnl7CiAgICBjb25zdCBkID0gYXdhaXQgYXBpKCcvYXBpL2F1dGgvbG9naW4nLHttZXRob2Q6J1BPU1QnLGJvZHk6SlNPTi5zdHJpbmdpZnkoe3Bob25lOnZhbCgnbF9waG9uZScpLHBhc3N3b3JkOnZhbCgnbF9wYXNzJyl9KX0pOwogICAgVE9LRU49ZC50b2tlbjsgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2lsX3Rva2VuJyxUT0tFTik7IE1FPWQudXNlcjsgVEFCPSdvdmVydmlldyc7IHNoZWxsKCk7CiAgfWNhdGNoKGUpeyB0b2FzdChlLm1lc3NhZ2UsJ2JhZCcpOyB9Cn0KYXN5bmMgZnVuY3Rpb24gZG9SZWcoKXsKICB0cnl7CiAgICBhd2FpdCBhcGkoJy9hcGkvYXV0aC9yZWdpc3Rlci1hZ2VudCcse21ldGhvZDonUE9TVCcsYm9keTpKU09OLnN0cmluZ2lmeSh7bmFtZTp2YWwoJ3JfbmFtZScpLHNob3BfbmFtZTp2YWwoJ3Jfc2hvcCcpLHBob25lOnZhbCgncl9waG9uZScpLHBhc3N3b3JkOnZhbCgncl9wYXNzJyl9KX0pOwogICAgdG9hc3QoJ0FjY291bnQgY3JlYXRlZC4gV2FpdGluZyBmb3IgYWRtaW4gYXBwcm92YWwuJywnb2snKTsgc2hvd0xvZ2luKCk7CiAgfWNhdGNoKGUpeyB0b2FzdChlLm1lc3NhZ2UsJ2JhZCcpOyB9Cn0KZnVuY3Rpb24gdmFsKGlkKXtyZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpLnZhbHVlLnRyaW0oKTt9CmZ1bmN0aW9uIGxvZ291dCgpe1RPS0VOPW51bGw7TUU9bnVsbDtsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnaWxfdG9rZW4nKTtsb2dpblZpZXcoKTt9CgovLyAtLS0tLS0tLS0tIHNoZWxsIC0tLS0tLS0tLS0KZnVuY3Rpb24gc2hlbGwoKXsKICBjb25zdCBpc0FkbWluID0gTUUucm9sZT09PSdhZG1pbic7CiAgY29uc3QgdGFicyA9IGlzQWRtaW4KICAgID8gW1snb3ZlcnZpZXcnLCdPdmVydmlldyddLFsnZW5yb2xsbWVudHMnLCdBcHByb3ZhbHMnXSxbJ2FnZW50cycsJ1Nob3BrZWVwZXJzJ10sWydjdXN0b21lcnMnLCdBbGwgY3VzdG9tZXJzJ10sWydyZW1pbmRlcnMnLCdSZW1pbmRlcnMnXV0KICAgIDogW1snb3ZlcnZpZXcnLCdPdmVydmlldyddLFsnbmV3Y3VzdG9tZXInLCdOZXcgc2FsZSddLFsnY3VzdG9tZXJzJywnTXkgY3VzdG9tZXJzJ10sWydyZW1pbmRlcnMnLCdSZW1pbmRlcnMnXV07CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcCcpLmlubmVySFRNTCA9IGAKICAgIDxoZWFkZXI+CiAgICAgIDxkaXYgY2xhc3M9ImxvZ28iPlBheTxzcGFuPm1pbnQ8L3NwYW4+PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9InNwYWNlciI+PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9IndobyI+JHtlc2MoTUUubmFtZSl9IMK3ICR7aXNBZG1pbj8nQWRtaW4nOmVzYyhNRS5zaG9wX25hbWV8fCdTaG9wa2VlcGVyJyl9PC9kaXY+CiAgICAgIDxidXR0b24gY2xhc3M9Imdob3N0IiBvbmNsaWNrPSJsb2dvdXQoKSI+TG9nb3V0PC9idXR0b24+CiAgICA8L2hlYWRlcj4KICAgIDxkaXYgY2xhc3M9IndyYXAiPgogICAgICA8ZGl2IGNsYXNzPSJ0YWJzIj4ke3RhYnMubWFwKChbayxsXSk9PmA8YnV0dG9uIGNsYXNzPSIke1RBQj09PWs/J2FjdGl2ZSc6Jyd9IiBvbmNsaWNrPSJnbygnJHtrfScpIj4ke2x9PC9idXR0b24+YCkuam9pbignJyl9PC9kaXY+CiAgICAgIDxkaXYgaWQ9InZpZXciPjwvZGl2PgogICAgPC9kaXY+YDsKICByZW5kZXIoKTsKfQpmdW5jdGlvbiBnbyh0KXtUQUI9dDtzaGVsbCgpO30KCmFzeW5jIGZ1bmN0aW9uIHJlbmRlcigpewogIGNvbnN0IHY9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXcnKTsKICB2LmlubmVySFRNTD0nPGRpdiBjbGFzcz0ibXV0ZWQiPkxvYWRpbmfigKY8L2Rpdj4nOwogIHRyeXsKICAgIGlmKFRBQj09PSdvdmVydmlldycpIHJldHVybiByZW5kZXJPdmVydmlldyh2KTsKICAgIGlmKFRBQj09PSdlbnJvbGxtZW50cycpIHJldHVybiByZW5kZXJFbnJvbGxtZW50cyh2KTsKICAgIGlmKFRBQj09PSdhZ2VudHMnKSByZXR1cm4gcmVuZGVyQWdlbnRzKHYpOwogICAgaWYoVEFCPT09J2N1c3RvbWVycycpIHJldHVybiByZW5kZXJDdXN0b21lcnModik7CiAgICBpZihUQUI9PT0ncmVtaW5kZXJzJykgcmV0dXJuIHJlbmRlclJlbWluZGVycyh2KTsKICAgIGlmKFRBQj09PSduZXdjdXN0b21lcicpIHJldHVybiByZW5kZXJOZXdDdXN0b21lcih2KTsKICB9Y2F0Y2goZSl7IHYuaW5uZXJIVE1MPSc8ZGl2IGNsYXNzPSJjYXJkIGJhZCI+Jytlc2MoZS5tZXNzYWdlKSsnPC9kaXY+JzsgfQp9CgovLyAtLS0tLS0tLS0tIHZpZXdzIC0tLS0tLS0tLS0KYXN5bmMgZnVuY3Rpb24gcmVuZGVyT3ZlcnZpZXcodil7CiAgY29uc3Qge2N1c3RvbWVyc30gPSBhd2FpdCBhcGkoJy9hcGkvY3VzdG9tZXJzJyk7CiAgY29uc3QgYWN0aXZlID0gY3VzdG9tZXJzLmZpbHRlcihjPT5jLnN0YXR1cz09PSdhY3RpdmUnKTsKICBjb25zdCBwZW5kaW5nID0gY3VzdG9tZXJzLmZpbHRlcihjPT5jLnN0YXR1cz09PSdwZW5kaW5nJyk7CiAgY29uc3QgbG9ja2VkID0gYWN0aXZlLmZpbHRlcihjPT5jLmRldmljZV9sb2NrZWQpOwogIGNvbnN0IGZpbmFuY2VkID0gYWN0aXZlLnJlZHVjZSgocyxjKT0+cytjLnN1bW1hcnkudG90YWxfZmluYW5jZWQsMCk7CiAgY29uc3QgY29sbGVjdGVkID0gYWN0aXZlLnJlZHVjZSgocyxjKT0+cytjLnN1bW1hcnkucGFpZCwwKTsKICBjb25zdCBvdXRzdGFuZGluZyA9IGFjdGl2ZS5yZWR1Y2UoKHMsYyk9PnMrYy5zdW1tYXJ5LnJlbWFpbmluZywwKTsKICB2LmlubmVySFRNTCA9IGAKICAgIDxkaXYgY2xhc3M9ImdyaWQiPgogICAgICAke2twaSgnQWN0aXZlIGN1c3RvbWVycycsYWN0aXZlLmxlbmd0aCl9CiAgICAgICR7a3BpKCdQZW5kaW5nIGFwcHJvdmFsJyxwZW5kaW5nLmxlbmd0aCl9CiAgICAgICR7a3BpKCdMb2NrZWQgZGV2aWNlcycsbG9ja2VkLmxlbmd0aCl9CiAgICAgICR7a3BpKCdGaW5hbmNlZCcsbW9uZXkoZmluYW5jZWQpKX0KICAgICAgJHtrcGkoJ0NvbGxlY3RlZCcsbW9uZXkoY29sbGVjdGVkKSl9CiAgICAgICR7a3BpKCdPdXRzdGFuZGluZycsbW9uZXkob3V0c3RhbmRpbmcpKX0KICAgIDwvZGl2PmA7Cn0KZnVuY3Rpb24ga3BpKGxhYmVsLHZhbHVlKXtyZXR1cm4gYDxkaXYgY2xhc3M9ImNhcmQiPjxkaXYgY2xhc3M9Im11dGVkIHNtYWxsIj4ke2xhYmVsfTwvZGl2PjxkaXYgY2xhc3M9ImtwaSI+JHt2YWx1ZX08L2Rpdj48L2Rpdj5gO30KCmFzeW5jIGZ1bmN0aW9uIHJlbmRlckFnZW50cyh2KXsKICBjb25zdCB7YWdlbnRzfSA9IGF3YWl0IGFwaSgnL2FwaS9hZG1pbi9hZ2VudHMnKTsKICB2LmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPSJjYXJkIj48dGFibGU+PHRyPjx0aD5OYW1lPC90aD48dGg+U2hvcDwvdGg+PHRoPlBob25lPC90aD48dGg+U3RhdHVzPC90aD48dGg+PC90aD48L3RyPgogICAgJHthZ2VudHMubWFwKGE9PmA8dHI+CiAgICAgIDx0ZD4ke2VzYyhhLm5hbWUpfTwvdGQ+PHRkPiR7ZXNjKGEuc2hvcF9uYW1lfHwnLScpfTwvdGQ+PHRkPiR7ZXNjKGEucGhvbmUpfTwvdGQ+CiAgICAgIDx0ZD48c3BhbiBjbGFzcz0icGlsbCAke2Euc3RhdHVzfSI+JHthLnN0YXR1c308L3NwYW4+PC90ZD4KICAgICAgPHRkIGNsYXNzPSJyb3ciPgogICAgICAgICR7YS5zdGF0dXMhPT0nYWN0aXZlJz9gPGJ1dHRvbiBjbGFzcz0ib2siIG9uY2xpY2s9ImFnZW50QWN0aW9uKCR7YS5pZH0sJ2FwcHJvdmUnKSI+QXBwcm92ZTwvYnV0dG9uPmA6Jyd9CiAgICAgICAgJHthLnN0YXR1cz09PSdhY3RpdmUnP2A8YnV0dG9uIGNsYXNzPSJiYWQiIG9uY2xpY2s9ImFnZW50QWN0aW9uKCR7YS5pZH0sJ3N1c3BlbmQnKSI+U3VzcGVuZDwvYnV0dG9uPmA6Jyd9CiAgICAgIDwvdGQ+PC90cj5gKS5qb2luKCcnKSB8fCAnPHRyPjx0ZCBjb2xzcGFuPTUgY2xhc3M9Im11dGVkIj5ObyBzaG9wa2VlcGVycyB5ZXQuPC90ZD48L3RyPid9CiAgPC90YWJsZT48L2Rpdj5gOwp9CmFzeW5jIGZ1bmN0aW9uIGFnZW50QWN0aW9uKGlkLGFjdCl7IHRyeXsgYXdhaXQgYXBpKGAvYXBpL2FkbWluL2FnZW50cy8ke2lkfS8ke2FjdH1gLHttZXRob2Q6J1BPU1QnfSk7IHRvYXN0KCdEb25lJywnb2snKTsgcmVuZGVyKCk7IH1jYXRjaChlKXt0b2FzdChlLm1lc3NhZ2UsJ2JhZCcpO30gfQoKYXN5bmMgZnVuY3Rpb24gcmVuZGVyRW5yb2xsbWVudHModil7CiAgY29uc3Qge2Vucm9sbG1lbnRzfSA9IGF3YWl0IGFwaSgnL2FwaS9hZG1pbi9lbnJvbGxtZW50cz9zdGF0dXM9cGVuZGluZycpOwogIGlmKCFlbnJvbGxtZW50cy5sZW5ndGgpeyB2LmlubmVySFRNTD0nPGRpdiBjbGFzcz0iY2FyZCBtdXRlZCI+Tm8gcGVuZGluZyBlbnJvbGxtZW50cy48L2Rpdj4nOyByZXR1cm47IH0KICB2LmlubmVySFRNTCA9IGVucm9sbG1lbnRzLm1hcChjPT5gCiAgICA8ZGl2IGNsYXNzPSJjYXJkIj4KICAgICAgPGRpdiBjbGFzcz0icm93Ij48Yj4ke2VzYyhjLm5hbWUpfTwvYj48c3BhbiBjbGFzcz0icGlsbCBwZW5kaW5nIj5wZW5kaW5nPC9zcGFuPgogICAgICAgIDxzcGFuIGNsYXNzPSJtdXRlZCBzbWFsbCI+YnkgJHtlc2MoYy5hZ2VudF9uYW1lKX0gKCR7ZXNjKGMuYWdlbnRfc2hvcHx8Jy0nKX0pPC9zcGFuPjwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJzbWFsbCBtdXRlZCIgc3R5bGU9Im1hcmdpbjo2cHggMCI+JHtlc2MoYy5waG9uZSl9IMK3IENOSUMgJHtlc2MoYy5jbmljfHwnLScpfSDCtyAke2VzYyhjLnByb2R1Y3R8fCctJyl9PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9InNtYWxsIj5QcmljZSAke21vbmV5KGMudG90YWxfcHJpY2UpfSDCtyBEb3duICR7bW9uZXkoYy5kb3duX3BheW1lbnQpfSDCtyAke2MubW9udGhzfSBtb250aHM8L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0idGh1bWJzIiBzdHlsZT0ibWFyZ2luOjEwcHggMCI+CiAgICAgICAgJHtjLnNlbGZpZV91cmw/YDxpbWcgc3JjPSIke2Muc2VsZmllX3VybH0iIG9uY2xpY2s9Im9wZW5JbWcoJyR7Yy5zZWxmaWVfdXJsfScpIiB0aXRsZT0iU2VsZmllIj5gOicnfQogICAgICAgICR7Yy5jbmljX3VybD9gPGltZyBzcmM9IiR7Yy5jbmljX3VybH0iIG9uY2xpY2s9Im9wZW5JbWcoJyR7Yy5jbmljX3VybH0nKSIgdGl0bGU9IkNOSUMiPmA6Jyd9CiAgICAgIDwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJyb3ciPgogICAgICAgIDxidXR0b24gY2xhc3M9Im9rIiBvbmNsaWNrPSJhcHByb3ZlQ3VzdCgke2MuaWR9KSI+QXBwcm92ZSAmIGVucm9sbDwvYnV0dG9uPgogICAgICAgIDxidXR0b24gY2xhc3M9ImJhZCIgb25jbGljaz0icmVqZWN0Q3VzdCgke2MuaWR9KSI+UmVqZWN0PC9idXR0b24+CiAgICAgIDwvZGl2PgogICAgPC9kaXY+YCkuam9pbignJyk7Cn0KYXN5bmMgZnVuY3Rpb24gYXBwcm92ZUN1c3QoaWQpeyB0cnl7IGF3YWl0IGFwaShgL2FwaS9hZG1pbi9jdXN0b21lcnMvJHtpZH0vYXBwcm92ZWAse21ldGhvZDonUE9TVCd9KTsgdG9hc3QoJ0Vucm9sbGVkLiBJbnN0YWxsbWVudCBwbGFuIGNyZWF0ZWQuJywnb2snKTsgcmVuZGVyKCk7IH1jYXRjaChlKXt0b2FzdChlLm1lc3NhZ2UsJ2JhZCcpO30gfQphc3luYyBmdW5jdGlvbiByZWplY3RDdXN0KGlkKXsgY29uc3QgcmVhc29uPXByb21wdCgnUmVhc29uIGZvciByZWplY3Rpb24/Jyl8fCcnOyB0cnl7IGF3YWl0IGFwaShgL2FwaS9hZG1pbi9jdXN0b21lcnMvJHtpZH0vcmVqZWN0YCx7bWV0aG9kOidQT1NUJyxib2R5OkpTT04uc3RyaW5naWZ5KHtyZWFzb259KX0pOyB0b2FzdCgnUmVqZWN0ZWQnLCdvaycpOyByZW5kZXIoKTsgfWNhdGNoKGUpe3RvYXN0KGUubWVzc2FnZSwnYmFkJyk7fSB9Cgphc3luYyBmdW5jdGlvbiByZW5kZXJDdXN0b21lcnModil7CiAgY29uc3Qge2N1c3RvbWVyc30gPSBhd2FpdCBhcGkoJy9hcGkvY3VzdG9tZXJzJyk7CiAgaWYoIWN1c3RvbWVycy5sZW5ndGgpeyB2LmlubmVySFRNTD0nPGRpdiBjbGFzcz0iY2FyZCBtdXRlZCI+Tm8gY3VzdG9tZXJzIHlldC48L2Rpdj4nOyByZXR1cm47IH0KICB2LmlubmVySFRNTCA9IGN1c3RvbWVycy5tYXAoYz0+ewogICAgY29uc3Qgcz1jLnN1bW1hcnk7CiAgICByZXR1cm4gYDxkaXYgY2xhc3M9ImNhcmQiPgogICAgICA8ZGl2IGNsYXNzPSJyb3ciPgogICAgICAgIDxiPiR7ZXNjKGMubmFtZSl9PC9iPgogICAgICAgIDxzcGFuIGNsYXNzPSJwaWxsICR7Yy5zdGF0dXN9Ij4ke2Muc3RhdHVzfTwvc3Bhbj4KICAgICAgICAke2MuZGV2aWNlX2xvY2tlZD8nPHNwYW4gY2xhc3M9InBpbGwgbG9ja2VkIj5kZXZpY2UgbG9ja2VkPC9zcGFuPic6Jyd9CiAgICAgIDwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJzbWFsbCBtdXRlZCIgc3R5bGU9Im1hcmdpbjo2cHggMCI+JHtlc2MoYy5waG9uZSl9IMK3ICR7ZXNjKGMucHJvZHVjdHx8Jy0nKX08L2Rpdj4KICAgICAgJHtjLnN0YXR1cz09PSdhY3RpdmUnfHxjLnN0YXR1cz09PSdjb21wbGV0ZWQnP2AKICAgICAgICA8ZGl2IGNsYXNzPSJyb3cgc21hbGwiPgogICAgICAgICAgPHNwYW4+UGFpZCA8Yj4ke21vbmV5KHMucGFpZCl9PC9iPjwvc3Bhbj4KICAgICAgICAgIDxzcGFuPlJlbWFpbmluZyA8Yj4ke21vbmV5KHMucmVtYWluaW5nKX08L2I+PC9zcGFuPgogICAgICAgICAgJHtzLm92ZXJkdWU/YDxzcGFuIHN0eWxlPSJjb2xvcjp2YXIoLS1iYWQpIj5PdmVyZHVlOiAke3Mub3ZlcmR1ZX08L3NwYW4+YDonJ30KICAgICAgICAgICR7cy5uZXh0X2R1ZT9gPHNwYW4gY2xhc3M9Im11dGVkIj5OZXh0OiAke21vbmV5KHMubmV4dF9kdWUuYW1vdW50KX0gb24gJHtzLm5leHRfZHVlLmR1ZV9kYXRlfTwvc3Bhbj5gOicnfQogICAgICAgIDwvZGl2PgogICAgICAgIDxidXR0b24gY2xhc3M9Imdob3N0IiBzdHlsZT0ibWFyZ2luLXRvcDoxMHB4IiBvbmNsaWNrPSJvcGVuQ3VzdCgke2MuaWR9KSI+VmlldyBpbnN0YWxsbWVudHM8L2J1dHRvbj4KICAgICAgYDooYy5zdGF0dXM9PT0ncmVqZWN0ZWQnP2A8ZGl2IGNsYXNzPSJzbWFsbCIgc3R5bGU9ImNvbG9yOnZhcigtLWJhZCkiPlJlamVjdGVkOiAke2VzYyhjLnJlamVjdF9yZWFzb258fCctJyl9PC9kaXY+YDpgPGRpdiBjbGFzcz0ic21hbGwgbXV0ZWQiPkF3YWl0aW5nIGFkbWluIGFwcHJvdmFsPC9kaXY+YCl9CiAgICA8L2Rpdj5gOwogIH0pLmpvaW4oJycpOwp9Cgphc3luYyBmdW5jdGlvbiBvcGVuQ3VzdChpZCl7CiAgY29uc3Qge2N1c3RvbWVyOmN9ID0gYXdhaXQgYXBpKCcvYXBpL2N1c3RvbWVycy8nK2lkKTsKICBjb25zdCByb3dzID0gYy5pbnN0YWxsbWVudHMubWFwKGk9PmA8dHI+CiAgICA8dGQ+JHtpLnNlcX08L3RkPjx0ZD4ke21vbmV5KGkuYW1vdW50KX08L3RkPjx0ZD4ke2kuZHVlX2RhdGV9PC90ZD4KICAgIDx0ZD4ke2kucGFpZD9gPHNwYW4gY2xhc3M9InBpbGwgY29tcGxldGVkIj5wYWlkPC9zcGFuPmA6KGkuZHVlX2RhdGU8bmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsMTApP2A8c3BhbiBjbGFzcz0icGlsbCByZWplY3RlZCI+b3ZlcmR1ZTwvc3Bhbj5gOmA8c3BhbiBjbGFzcz0icGlsbCBwZW5kaW5nIj5kdWU8L3NwYW4+YCl9PC90ZD4KICAgIDx0ZD4ke2kucGFpZD9lc2MoaS5tZXRob2R8fCcnKTpgPGJ1dHRvbiBvbmNsaWNrPSJwYXlJbnN0KCR7aS5pZH0sJHtpZH0pIj5SZWNvcmQgcGF5bWVudDwvYnV0dG9uPmB9PC90ZD4KICA8L3RyPmApLmpvaW4oJycpOwogIGRsZyhgJHtlc2MoYy5uYW1lKX0g4oCUIGluc3RhbGxtZW50c2AsIGAKICAgIDxkaXYgY2xhc3M9InJvdyBzbWFsbCIgc3R5bGU9Im1hcmdpbi1ib3R0b206MTBweCI+CiAgICAgIDxzcGFuPkZpbmFuY2VkIDxiPiR7bW9uZXkoYy5zdW1tYXJ5LnRvdGFsX2ZpbmFuY2VkKX08L2I+PC9zcGFuPgogICAgICA8c3Bhbj5QYWlkIDxiPiR7bW9uZXkoYy5zdW1tYXJ5LnBhaWQpfTwvYj48L3NwYW4+CiAgICAgIDxzcGFuPlJlbWFpbmluZyA8Yj4ke21vbmV5KGMuc3VtbWFyeS5yZW1haW5pbmcpfTwvYj48L3NwYW4+CiAgICAgICR7Yy5kZXZpY2VfbG9ja2VkPyc8c3BhbiBjbGFzcz0icGlsbCBsb2NrZWQiPmRldmljZSBsb2NrZWQ8L3NwYW4+JzonJ30KICAgIDwvZGl2PgogICAgPHRhYmxlPjx0cj48dGg+IzwvdGg+PHRoPkFtb3VudDwvdGg+PHRoPkR1ZTwvdGg+PHRoPlN0YXR1czwvdGg+PHRoPjwvdGg+PC90cj4ke3Jvd3N9PC90YWJsZT5gLAogICAgYDxidXR0b24gY2xhc3M9Imdob3N0IiBvbmNsaWNrPSJjbG9zZURsZygpIj5DbG9zZTwvYnV0dG9uPmApOwp9CmFzeW5jIGZ1bmN0aW9uIHBheUluc3QoaW5zdElkLGN1c3RJZCl7CiAgY29uc3QgbWV0aG9kID0gcHJvbXB0KCdQYXltZW50IG1ldGhvZD8gKGphenpjYXNoIC8gZWFzeXBhaXNhIC8gY2FzaCknLCdjYXNoJyl8fCdjYXNoJzsKICBjb25zdCB0eG4gPSBtZXRob2Q9PT0nY2FzaCc/Jyc6KHByb21wdCgnVHJhbnNhY3Rpb24gcmVmZXJlbmNlPycpfHwnJyk7CiAgdHJ5eyBhd2FpdCBhcGkoYC9hcGkvaW5zdGFsbG1lbnRzLyR7aW5zdElkfS9wYXlgLHttZXRob2Q6J1BPU1QnLGJvZHk6SlNPTi5zdHJpbmdpZnkoe21ldGhvZCx0eG5fcmVmOnR4bn0pfSk7IHRvYXN0KCdQYXltZW50IHJlY29yZGVkJywnb2snKTsgY2xvc2VEbGcoKTsgb3BlbkN1c3QoY3VzdElkKTsgfWNhdGNoKGUpe3RvYXN0KGUubWVzc2FnZSwnYmFkJyk7fQp9Cgphc3luYyBmdW5jdGlvbiByZW5kZXJSZW1pbmRlcnModil7CiAgY29uc3Qge3JlbWluZGVycyx0aHJvdWdofSA9IGF3YWl0IGFwaSgnL2FwaS9yZW1pbmRlcnMnKTsKICB2LmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPSJjYXJkIj4KICAgIDxkaXYgY2xhc3M9Im11dGVkIHNtYWxsIiBzdHlsZT0ibWFyZ2luLWJvdHRvbTo4cHgiPkluc3RhbGxtZW50cyBkdWUgb24gb3IgYmVmb3JlIDxiPiR7dGhyb3VnaH08L2I+ICgyLWRheSByZW1pbmRlciB3aW5kb3cpPC9kaXY+CiAgICA8dGFibGU+PHRyPjx0aD5DdXN0b21lcjwvdGg+PHRoPlBob25lPC90aD48dGg+SW5zdGFsbG1lbnQ8L3RoPjx0aD5BbW91bnQ8L3RoPjx0aD5EdWU8L3RoPjwvdHI+CiAgICAke3JlbWluZGVycy5tYXAocj0+YDx0cj48dGQ+JHtlc2Moci5jdXN0b21lcl9uYW1lKX08L3RkPjx0ZD4ke2VzYyhyLmN1c3RvbWVyX3Bob25lKX08L3RkPjx0ZD4jJHtyLnNlcX08L3RkPjx0ZD4ke21vbmV5KHIuYW1vdW50KX08L3RkPjx0ZD4ke3IuZHVlX2RhdGV9PC90ZD48L3RyPmApLmpvaW4oJycpIHx8ICc8dHI+PHRkIGNvbHNwYW49NSBjbGFzcz0ibXV0ZWQiPk5vdGhpbmcgZHVlIGluIHRoZSBuZXh0IDIgZGF5cy48L3RkPjwvdHI+J30KICAgIDwvdGFibGU+PC9kaXY+YDsKfQoKZnVuY3Rpb24gcmVuZGVyTmV3Q3VzdG9tZXIodil7CiAgdi5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz0iY2FyZCI+CiAgICA8aDMgc3R5bGU9Im1hcmdpbi10b3A6MCI+TmV3IGluc3RhbGxtZW50IHNhbGU8L2gzPgogICAgPGxhYmVsPkN1c3RvbWVyIG5hbWU8L2xhYmVsPjxpbnB1dCBpZD0ibl9uYW1lIiAvPgogICAgPGxhYmVsPlBob25lPC9sYWJlbD48aW5wdXQgaWQ9Im5fcGhvbmUiIHBsYWNlaG9sZGVyPSIwM3h4eHh4eHh4eCIgLz4KICAgIDxsYWJlbD5DTklDIG51bWJlcjwvbGFiZWw+PGlucHV0IGlkPSJuX2NuaWMiIHBsYWNlaG9sZGVyPSJ4eHh4eC14eHh4eHh4LXgiIC8+CiAgICA8bGFiZWw+UHJvZHVjdCAoZS5nLiBwaG9uZSBtb2RlbCk8L2xhYmVsPjxpbnB1dCBpZD0ibl9wcm9kdWN0IiAvPgogICAgPGRpdiBjbGFzcz0iZ3JpZCIgc3R5bGU9ImdyaWQtdGVtcGxhdGUtY29sdW1uczoxZnIgMWZyIDFmciI+CiAgICAgIDxkaXY+PGxhYmVsPlRvdGFsIHByaWNlPC9sYWJlbD48aW5wdXQgaWQ9Im5fdG90YWwiIHR5cGU9Im51bWJlciIgLz48L2Rpdj4KICAgICAgPGRpdj48bGFiZWw+RG93biBwYXltZW50PC9sYWJlbD48aW5wdXQgaWQ9Im5fZG93biIgdHlwZT0ibnVtYmVyIiAvPjwvZGl2PgogICAgICA8ZGl2PjxsYWJlbD5Nb250aHM8L2xhYmVsPjxpbnB1dCBpZD0ibl9tb250aHMiIHR5cGU9Im51bWJlciIgLz48L2Rpdj4KICAgIDwvZGl2PgogICAgPGxhYmVsPkN1c3RvbWVyIHNlbGZpZSAocmVxdWlyZWQpPC9sYWJlbD48aW5wdXQgaWQ9Im5fc2VsZmllIiB0eXBlPSJmaWxlIiBhY2NlcHQ9ImltYWdlLyoiIGNhcHR1cmU9InVzZXIiIC8+CiAgICA8bGFiZWw+Q05JQyBwaG90byAocmVxdWlyZWQpPC9sYWJlbD48aW5wdXQgaWQ9Im5fY25pY2ltZyIgdHlwZT0iZmlsZSIgYWNjZXB0PSJpbWFnZS8qIiBjYXB0dXJlPSJlbnZpcm9ubWVudCIgLz4KICAgIDxkaXYgY2xhc3M9InNtYWxsIG11dGVkIiBzdHlsZT0ibWFyZ2luLXRvcDo4cHgiPkN1c3RvbWVyIGNvbnNlbnRzIHRvIGluc3RhbGxtZW50IHRlcm1zLCBpbmNsdWRpbmcgdGhhdCB0aGUgZGV2aWNlIG1heSBiZSBsb2NrZWQgZm9yIG1pc3NlZCBwYXltZW50cywgYmVmb3JlIGVucm9sbG1lbnQuPC9kaXY+CiAgICA8YnV0dG9uIHN0eWxlPSJtYXJnaW4tdG9wOjE0cHgiIGlkPSJuX3N1Ym1pdCIgb25jbGljaz0ic3VibWl0Q3VzdG9tZXIoKSI+U3VibWl0IGZvciBhcHByb3ZhbDwvYnV0dG9uPgogIDwvZGl2PmA7Cn0KZnVuY3Rpb24gZmlsZVRvRGF0YVVybChpbnB1dCl7CiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKT0+ewogICAgY29uc3QgZj1pbnB1dC5maWxlcyYmaW5wdXQuZmlsZXNbMF07IGlmKCFmKSByZXR1cm4gcmVzb2x2ZShudWxsKTsKICAgIGNvbnN0IHI9bmV3IEZpbGVSZWFkZXIoKTsgci5vbmxvYWQ9KCk9PnJlc29sdmUoci5yZXN1bHQpOyByLnJlYWRBc0RhdGFVUkwoZik7CiAgfSk7Cn0KYXN5bmMgZnVuY3Rpb24gc3VibWl0Q3VzdG9tZXIoKXsKICBjb25zdCBidG49ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25fc3VibWl0Jyk7IGJ0bi5kaXNhYmxlZD10cnVlOwogIHRyeXsKICAgIGNvbnN0IHNlbGZpZT1hd2FpdCBmaWxlVG9EYXRhVXJsKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduX3NlbGZpZScpKTsKICAgIGNvbnN0IGNuaWNfcGhvdG89YXdhaXQgZmlsZVRvRGF0YVVybChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbl9jbmljaW1nJykpOwogICAgaWYoIXNlbGZpZXx8IWNuaWNfcGhvdG8peyB0b2FzdCgnU2VsZmllIGFuZCBDTklDIHBob3RvIGFyZSByZXF1aXJlZCcsJ2JhZCcpOyBidG4uZGlzYWJsZWQ9ZmFsc2U7IHJldHVybjsgfQogICAgYXdhaXQgYXBpKCcvYXBpL2N1c3RvbWVycycse21ldGhvZDonUE9TVCcsYm9keTpKU09OLnN0cmluZ2lmeSh7CiAgICAgIG5hbWU6dmFsKCduX25hbWUnKSxwaG9uZTp2YWwoJ25fcGhvbmUnKSxjbmljOnZhbCgnbl9jbmljJykscHJvZHVjdDp2YWwoJ25fcHJvZHVjdCcpLAogICAgICB0b3RhbF9wcmljZTp2YWwoJ25fdG90YWwnKSxkb3duX3BheW1lbnQ6dmFsKCduX2Rvd24nKSxtb250aHM6dmFsKCduX21vbnRocycpLAogICAgICBzZWxmaWUsIGNuaWNfcGhvdG8KICAgIH0pfSk7CiAgICB0b2FzdCgnU3VibWl0dGVkIGZvciBhZG1pbiBhcHByb3ZhbCcsJ29rJyk7IGdvKCdjdXN0b21lcnMnKTsKICB9Y2F0Y2goZSl7IHRvYXN0KGUubWVzc2FnZSwnYmFkJyk7IGJ0bi5kaXNhYmxlZD1mYWxzZTsgfQp9CgovLyAtLS0tLS0tLS0tIGRpYWxvZyAvIGltYWdlIC0tLS0tLS0tLS0KZnVuY3Rpb24gZGxnKHRpdGxlLGJvZHksZm9vdGVyKXsKICBsZXQgZD1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGxnJyk7IGlmKGQpIGQucmVtb3ZlKCk7CiAgZD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaWFsb2cnKTsgZC5pZD0nZGxnJzsKICBkLmlubmVySFRNTD1gPGRpdiBjbGFzcz0iZGxnLWgiPiR7dGl0bGV9PC9kaXY+PGRpdiBjbGFzcz0iZGxnLWIiPiR7Ym9keX08L2Rpdj48ZGl2IGNsYXNzPSJkbGctZiI+JHtmb290ZXJ8fCcnfTwvZGl2PmA7CiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkKTsgZC5zaG93TW9kYWwoKTsKfQpmdW5jdGlvbiBjbG9zZURsZygpe2NvbnN0IGQ9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RsZycpOyBpZihkKXtkLmNsb3NlKCk7ZC5yZW1vdmUoKTt9fQpmdW5jdGlvbiBvcGVuSW1nKHVybCl7IGRsZygnSW1hZ2UnLGA8aW1nIHNyYz0iJHt1cmx9IiBzdHlsZT0id2lkdGg6MTAwJTtib3JkZXItcmFkaXVzOjEwcHgiPmAsYDxidXR0b24gY2xhc3M9Imdob3N0IiBvbmNsaWNrPSJjbG9zZURsZygpIj5DbG9zZTwvYnV0dG9uPmApOyB9CgovLyAtLS0tLS0tLS0tIGJvb3QgLS0tLS0tLS0tLQooYXN5bmMgZnVuY3Rpb24oKXsKICBpZihUT0tFTil7CiAgICB0cnl7IGNvbnN0IGQ9YXdhaXQgYXBpKCcvYXBpL21lJyk7IE1FPWQudXNlcjsgc2hlbGwoKTsgcmV0dXJuOyB9Y2F0Y2h7IGxvZ291dCgpOyB9CiAgfQogIGxvZ2luVmlldygpOwp9KSgpOwo8L3NjcmlwdD4KPC9ib2R5Pgo8L2h0bWw+Cg==', 'base64').toString('utf8');

// ---------- auth ----------
'use strict';
// Zero-dependency auth: scrypt password hashing + HMAC-signed tokens (JWT-like).

const SECRET = process.env.APP_SECRET || 'dev-secret-change-me';

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 32);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
  try {
    const [, saltHex, hashHex] = stored.split('$');
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(String(password), salt, 32);
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlJson(obj) {
  return b64url(JSON.stringify(obj));
}
function fromB64url(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

// Minimal JWT (HS256).
function signToken(payload, expiresInSec = 60 * 60 * 24 * 7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresInSec };
  const data = `${b64urlJson(header)}.${b64urlJson(body)}`;
  const sig = b64url(crypto.createHmac('sha256', SECRET).update(data).digest());
  return `${data}.${sig}`;
}

function verifyToken(token) {
  try {
    const [h, p, s] = String(token).split('.');
    if (!h || !p || !s) return null;
    const data = `${h}.${p}`;
    const expected = b64url(crypto.createHmac('sha256', SECRET).update(data).digest());
    const a = Buffer.from(s);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(fromB64url(p).toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}



// ---------- db ----------
'use strict';
// Zero-dependency SQLite layer using Node's built-in node:sqlite (Node 22+).

const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'installlock.db');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  role         TEXT NOT NULL CHECK(role IN ('admin','agent')),
  name         TEXT NOT NULL,
  shop_name    TEXT,
  phone        TEXT UNIQUE NOT NULL,
  password     TEXT NOT NULL,           -- scrypt hash
  status       TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id     INTEGER NOT NULL REFERENCES users(id),
  name         TEXT NOT NULL,
  phone        TEXT NOT NULL,
  cnic         TEXT,                     -- CNIC number
  selfie_path  TEXT,                     -- stored image file
  cnic_path    TEXT,                     -- stored image file
  product      TEXT,                     -- what was sold (e.g. phone model)
  total_price  REAL NOT NULL DEFAULT 0,
  down_payment REAL NOT NULL DEFAULT 0,
  months       INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','rejected','completed')),
  reject_reason TEXT,
  device_locked INTEGER NOT NULL DEFAULT 0,  -- 0/1, controlled after missed payment
  device_id    TEXT,                     -- registered lock-app device identifier
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS installments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id  INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  seq          INTEGER NOT NULL,         -- 1..months
  amount       REAL NOT NULL,
  due_date     TEXT NOT NULL,            -- YYYY-MM-DD
  paid         INTEGER NOT NULL DEFAULT 0,
  paid_at      TEXT,
  method       TEXT,                     -- jazzcash / easypaisa / cash
  txn_ref      TEXT
);

CREATE INDEX IF NOT EXISTS idx_customers_agent ON customers(agent_id);
CREATE INDEX IF NOT EXISTS idx_inst_customer ON installments(customer_id);
CREATE INDEX IF NOT EXISTS idx_inst_due ON installments(due_date, paid);
`);



// ---------- seed admin on startup (idempotent) ----------
(function(){
  const existing = db.prepare("SELECT id FROM users WHERE role='admin'").get();
  if(!existing){
    const phone = process.env.ADMIN_PHONE || '03000000000';
    const pass = process.env.ADMIN_PASSWORD || 'admin123';
    const name = process.env.ADMIN_NAME || 'Owner';
    db.prepare("INSERT INTO users (role,name,phone,password,status) VALUES ('admin',?,?,?, 'active')").run(name, phone, hashPassword(pass));
    console.log('Admin seeded: phone=' + phone);
  }
})();

// ---------- server ----------
'use strict';
// Zero-dependency HTTP server for Paymint backend + dashboard.

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- tiny helpers ----------
function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(payload);
}
function readBody(req, limit = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}
function today() { return new Date().toISOString().slice(0, 10); }
function addMonths(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}
function saveImage(dataUrl, prefix) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const m = dataUrl.match(/^data:(image\/(png|jpe?g|webp));base64,(.+)$/);
  if (!m) return null;
  const ext = m[2] === 'jpeg' ? 'jpg' : m[2];
  const name = `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), Buffer.from(m[3], 'base64'));
  return name;
}

// ---------- auth middleware ----------
function authUser(req) {
  const h = req.headers['authorization'] || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = db.prepare('SELECT id, role, name, shop_name, phone, status FROM users WHERE id = ?').get(payload.uid);
  if (!user || user.status !== 'active') return null;
  return user;
}

// ---------- domain logic ----------
function generateSchedule(customer) {
  const principal = Math.max(0, customer.total_price - customer.down_payment);
  const months = customer.months;
  if (months <= 0) return;
  const base = Math.floor((principal / months) * 100) / 100;
  let allocated = 0;
  const stmt = db.prepare('INSERT INTO installments (customer_id, seq, amount, due_date) VALUES (?,?,?,?)');
  for (let i = 1; i <= months; i++) {
    let amt = base;
    if (i === months) amt = Math.round((principal - allocated) * 100) / 100; // last catches rounding
    allocated += base;
    stmt.run(customer.id, i, amt, addMonths(today(), i));
  }
}

// A customer SHOULD be locked if any installment is overdue and unpaid.
function overdueCount(customerId) {
  return db.prepare(
    "SELECT COUNT(*) c FROM installments WHERE customer_id = ? AND paid = 0 AND due_date < ?"
  ).get(customerId, today()).c;
}
function refreshLockState(customerId) {
  const c = db.prepare('SELECT status FROM customers WHERE id = ?').get(customerId);
  if (!c) return;
  const locked = c.status === 'active' && overdueCount(customerId) > 0 ? 1 : 0;
  db.prepare('UPDATE customers SET device_locked = ? WHERE id = ?').run(locked, customerId);
}

function customerView(c) {
  const inst = db.prepare('SELECT * FROM installments WHERE customer_id = ? ORDER BY seq').all(c.id);
  const paid = inst.filter(i => i.paid).reduce((s, i) => s + i.amount, 0);
  const total = inst.reduce((s, i) => s + i.amount, 0);
  const nextDue = inst.find(i => !i.paid) || null;
  return {
    ...c,
    selfie_url: c.selfie_path ? `/api/files/${c.selfie_path}` : null,
    cnic_url: c.cnic_path ? `/api/files/${c.cnic_path}` : null,
    installments: inst,
    summary: {
      total_financed: Math.round(total * 100) / 100,
      paid: Math.round(paid * 100) / 100,
      remaining: Math.round((total - paid) * 100) / 100,
      overdue: overdueCount(c.id),
      next_due: nextDue ? { seq: nextDue.seq, amount: nextDue.amount, due_date: nextDue.due_date } : null,
    },
  };
}

// ---------- routes ----------
const routes = [];
function route(method, pattern, handler) {
  const keys = [];
  const rx = new RegExp('^' + pattern.replace(/:[^/]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
  routes.push({ method, rx, keys, handler });
}

// --- Auth ---
route('POST', '/api/auth/register-agent', async (req, res) => {
  const b = await readBody(req);
  if (!b.name || !b.phone || !b.password) return send(res, 400, { error: 'name, phone, password required' });
  const exists = db.prepare('SELECT id FROM users WHERE phone = ?').get(b.phone);
  if (exists) return send(res, 409, { error: 'phone already registered' });
  const info = db.prepare(
    "INSERT INTO users (role, name, shop_name, phone, password, status) VALUES ('agent',?,?,?,?,'pending')"
  ).run(b.name, b.shop_name || null, b.phone, hashPassword(b.password));
  send(res, 201, { id: info.lastInsertRowid, status: 'pending', message: 'Account created. Waiting for admin approval.' });
});

route('POST', '/api/auth/login', async (req, res) => {
  const b = await readBody(req);
  const u = db.prepare('SELECT * FROM users WHERE phone = ?').get(b.phone || '');
  if (!u || !verifyPassword(b.password || '', u.password)) return send(res, 401, { error: 'invalid phone or password' });
  if (u.status === 'pending') return send(res, 403, { error: 'account pending admin approval' });
  if (u.status === 'suspended') return send(res, 403, { error: 'account suspended' });
  const token = signToken({ uid: u.id, role: u.role });
  send(res, 200, { token, user: { id: u.id, role: u.role, name: u.name, shop_name: u.shop_name, phone: u.phone } });
});

route('GET', '/api/me', async (req, res, _p, user) => {
  if (!user) return send(res, 401, { error: 'unauthorized' });
  send(res, 200, { user });
});

// --- Admin: agents ---
route('GET', '/api/admin/agents', async (req, res, _p, user) => {
  if (!user || user.role !== 'admin') return send(res, 403, { error: 'admin only' });
  const rows = db.prepare("SELECT id, name, shop_name, phone, status, created_at FROM users WHERE role='agent' ORDER BY created_at DESC").all();
  send(res, 200, { agents: rows });
});
route('POST', '/api/admin/agents/:id/approve', async (req, res, p, user) => {
  if (!user || user.role !== 'admin') return send(res, 403, { error: 'admin only' });
  db.prepare("UPDATE users SET status='active' WHERE id=? AND role='agent'").run(p.id);
  send(res, 200, { ok: true });
});
route('POST', '/api/admin/agents/:id/suspend', async (req, res, p, user) => {
  if (!user || user.role !== 'admin') return send(res, 403, { error: 'admin only' });
  db.prepare("UPDATE users SET status='suspended' WHERE id=? AND role='agent'").run(p.id);
  send(res, 200, { ok: true });
});

// --- Admin: enrollment approvals ---
route('GET', '/api/admin/enrollments', async (req, res, _p, user) => {
  if (!user || user.role !== 'admin') return send(res, 403, { error: 'admin only' });
  const status = new URL(req.url, 'http://x').searchParams.get('status') || 'pending';
  const rows = db.prepare(`
    SELECT c.*, u.name agent_name, u.shop_name agent_shop
    FROM customers c JOIN users u ON u.id = c.agent_id
    WHERE c.status = ? ORDER BY c.created_at DESC`).all(status);
  send(res, 200, { enrollments: rows.map(customerView) });
});
route('POST', '/api/admin/customers/:id/approve', async (req, res, p, user) => {
  if (!user || user.role !== 'admin') return send(res, 403, { error: 'admin only' });
  const c = db.prepare('SELECT * FROM customers WHERE id = ?').get(p.id);
  if (!c) return send(res, 404, { error: 'not found' });
  if (c.status !== 'pending') return send(res, 400, { error: 'already processed' });
  db.prepare("UPDATE customers SET status='active' WHERE id=?").run(c.id);
  const fresh = db.prepare('SELECT * FROM customers WHERE id = ?').get(c.id);
  generateSchedule(fresh);
  refreshLockState(c.id);
  send(res, 200, { ok: true });
});
route('POST', '/api/admin/customers/:id/reject', async (req, res, p, user) => {
  if (!user || user.role !== 'admin') return send(res, 403, { error: 'admin only' });
  const b = await readBody(req);
  db.prepare("UPDATE customers SET status='rejected', reject_reason=? WHERE id=? AND status='pending'").run(b.reason || null, p.id);
  send(res, 200, { ok: true });
});

// --- Agent: customers ---
route('POST', '/api/customers', async (req, res, _p, user) => {
  if (!user || user.role !== 'agent') return send(res, 403, { error: 'agent only' });
  const b = await readBody(req);
  if (!b.name || !b.phone) return send(res, 400, { error: 'name and phone required' });
  if (!b.selfie || !b.cnic_photo) return send(res, 400, { error: 'customer selfie and CNIC photo required for enrollment' });
  const selfie_path = saveImage(b.selfie, 'selfie');
  const cnic_path = saveImage(b.cnic_photo, 'cnic');
  if (!selfie_path || !cnic_path) return send(res, 400, { error: 'images must be base64 data URLs (png/jpg/webp)' });
  const info = db.prepare(`
    INSERT INTO customers (agent_id, name, phone, cnic, selfie_path, cnic_path, product, total_price, down_payment, months, status)
    VALUES (?,?,?,?,?,?,?,?,?,?, 'pending')`).run(
    user.id, b.name, b.phone, b.cnic || null, selfie_path, cnic_path, b.product || null,
    Number(b.total_price) || 0, Number(b.down_payment) || 0, Number(b.months) || 0);
  send(res, 201, { id: info.lastInsertRowid, status: 'pending', message: 'Enrollment submitted for admin approval.' });
});
route('GET', '/api/customers', async (req, res, _p, user) => {
  if (!user) return send(res, 401, { error: 'unauthorized' });
  const rows = user.role === 'admin'
    ? db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all()
    : db.prepare('SELECT * FROM customers WHERE agent_id = ? ORDER BY created_at DESC').all(user.id);
  send(res, 200, { customers: rows.map(customerView) });
});
route('GET', '/api/customers/:id', async (req, res, p, user) => {
  if (!user) return send(res, 401, { error: 'unauthorized' });
  const c = db.prepare('SELECT * FROM customers WHERE id = ?').get(p.id);
  if (!c) return send(res, 404, { error: 'not found' });
  if (user.role === 'agent' && c.agent_id !== user.id) return send(res, 403, { error: 'forbidden' });
  refreshLockState(c.id);
  send(res, 200, { customer: customerView(db.prepare('SELECT * FROM customers WHERE id = ?').get(c.id)) });
});

// --- Payments / installments ---
route('POST', '/api/installments/:id/pay', async (req, res, p, user) => {
  if (!user) return send(res, 401, { error: 'unauthorized' });
  const b = await readBody(req);
  const inst = db.prepare('SELECT * FROM installments WHERE id = ?').get(p.id);
  if (!inst) return send(res, 404, { error: 'not found' });
  const c = db.prepare('SELECT * FROM customers WHERE id = ?').get(inst.customer_id);
  if (user.role === 'agent' && c.agent_id !== user.id) return send(res, 403, { error: 'forbidden' });
  if (inst.paid) return send(res, 400, { error: 'already paid' });
  db.prepare("UPDATE installments SET paid=1, paid_at=datetime('now'), method=?, txn_ref=? WHERE id=?")
    .run(b.method || 'cash', b.txn_ref || null, inst.id);
  // complete customer if all paid
  const remaining = db.prepare('SELECT COUNT(*) c FROM installments WHERE customer_id=? AND paid=0').get(inst.customer_id).c;
  if (remaining === 0) db.prepare("UPDATE customers SET status='completed', device_locked=0 WHERE id=?").run(inst.customer_id);
  else refreshLockState(inst.customer_id);
  send(res, 200, { ok: true, remaining });
});

// --- Reminders: installments due within 2 days, unpaid ---
route('GET', '/api/reminders', async (req, res, _p, user) => {
  if (!user) return send(res, 401, { error: 'unauthorized' });
  const t = today();
  const in2 = addMonths; // not used; compute 2 days
  const d = new Date(t + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 2);
  const limit = d.toISOString().slice(0, 10);
  const base = `
    SELECT i.id, i.seq, i.amount, i.due_date, c.id customer_id, c.name customer_name, c.phone customer_phone, c.agent_id
    FROM installments i JOIN customers c ON c.id = i.customer_id
    WHERE i.paid = 0 AND c.status = 'active' AND i.due_date <= ?`;
  const rows = user.role === 'admin'
    ? db.prepare(base + ' ORDER BY i.due_date').all(limit)
    : db.prepare(base + ' AND c.agent_id = ? ORDER BY i.due_date').all(limit, user.id);
  send(res, 200, { reminders: rows, as_of: t, through: limit });
});

// --- Device lock polling (used by the lock APK) ---
route('POST', '/api/device/register', async (req, res, _p, user) => {
  if (!user) return send(res, 401, { error: 'unauthorized' });
  const b = await readBody(req);
  const c = db.prepare('SELECT * FROM customers WHERE id = ?').get(b.customer_id);
  if (!c) return send(res, 404, { error: 'customer not found' });
  if (user.role === 'agent' && c.agent_id !== user.id) return send(res, 403, { error: 'forbidden' });
  db.prepare('UPDATE customers SET device_id = ? WHERE id = ?').run(b.device_id || null, c.id);
  send(res, 200, { ok: true });
});
// Lock app polls this (device_id acts as shared identifier). Returns whether device should be locked.
route('GET', '/api/device/status', async (req, res) => {
  const device_id = new URL(req.url, 'http://x').searchParams.get('device_id');
  if (!device_id) return send(res, 400, { error: 'device_id required' });
  const c = db.prepare('SELECT * FROM customers WHERE device_id = ?').get(device_id);
  if (!c) return send(res, 404, { error: 'device not registered' });
  refreshLockState(c.id);
  const fresh = db.prepare('SELECT device_locked, status FROM customers WHERE id = ?').get(c.id);
  send(res, 200, {
    locked: !!fresh.device_locked,
    status: fresh.status,
    message: fresh.device_locked
      ? 'Aapki installment due hai. Bara-e-karam ada karein taake phone unlock ho jaye.'
      : 'OK',
  });
});

// ---------- static + files ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
function serveStatic(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, { error: 'not found' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const pathname = decodeURIComponent(url.pathname);

    // uploaded files (auth-gated)
    if (pathname.startsWith('/api/files/')) {
      const user = authUser(req);
      if (!user) return send(res, 401, { error: 'unauthorized' });
      const name = path.basename(pathname.slice('/api/files/'.length));
      return serveStatic(res, path.join(UPLOAD_DIR, name));
    }

    if (pathname.startsWith('/api/')) {
      const match = routes.find(r => r.method === req.method && r.rx.test(pathname));
      if (!match) return send(res, 404, { error: 'route not found' });
      const m = pathname.match(match.rx);
      const params = {};
      match.keys.forEach((k, i) => { params[k] = m[i + 1]; });
      const needsAuth = !['/api/auth/login', '/api/auth/register-agent', '/api/device/status'].includes(pathname);
      const user = authUser(req);
      if (needsAuth && !user) return send(res, 401, { error: 'unauthorized' });
      return match.handler(req, res, params, user);
    }

          // static dashboard (embedded)
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(EMBEDDED_HTML);
  } catch (e) {
    send(res, e.message === 'invalid JSON' || e.message === 'payload too large' ? 400 : 500, { error: e.message });
  }
});

server.listen(PORT, () => console.log(`Paymint backend running on http://localhost:${PORT}`));

