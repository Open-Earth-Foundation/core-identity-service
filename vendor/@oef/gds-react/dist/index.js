import { Button as e } from "@base-ui/react/button";
import { jsx as t, jsxs as n } from "react/jsx-runtime";
import { Field as r } from "@base-ui/react/field";
import { Input as i } from "@base-ui/react/input";
import { Checkbox as a } from "@base-ui/react/checkbox";
import { Radio as o } from "@base-ui/react/radio";
import { RadioGroup as s } from "@base-ui/react/radio-group";
import { Switch as c } from "@base-ui/react/switch";
import { Tabs as l } from "@base-ui/react/tabs";
import { Dialog as u } from "@base-ui/react/dialog";
import { Tooltip as d } from "@base-ui/react/tooltip";
// src/utils.ts
function f(...e) {
	return e.filter(Boolean).join(" ");
}
var p = {
	root: "gds-button",
	icon: "gds-button__icon",
	label: "gds-button__label"
};
// src/components/Button/Button.tsx
function m({ variant: r = "primary", size: i = "md", iconStart: a, iconEnd: o, iconOnly: s = !1, className: c, children: l, ...u }) {
	return /* @__PURE__ */ n(e, {
		className: f(p.root, c),
		"data-variant": r,
		"data-size": i,
		"data-icon-only": s || void 0,
		...u,
		children: [
			a && /* @__PURE__ */ t("span", {
				className: p.icon,
				children: a
			}),
			s ? /* @__PURE__ */ t("span", {
				className: p.icon,
				children: l
			}) : /* @__PURE__ */ t("span", {
				className: p.label,
				children: l
			}),
			o && /* @__PURE__ */ t("span", {
				className: p.icon,
				children: o
			})
		]
	});
}
var h = {
	root: "gds-text-field",
	label: "gds-text-field__label",
	required: "gds-text-field__required",
	control: "gds-text-field__control",
	input: "gds-text-field__input",
	suffix: "gds-text-field__suffix",
	help: "gds-text-field__help",
	error: "gds-text-field__error"
};
// src/components/TextField/TextField.tsx
function g({ label: e, description: a, error: o, suffix: s, required: c, disabled: l, name: u, className: d, ...p }) {
	return /* @__PURE__ */ n(r.Root, {
		className: f(h.root, d),
		invalid: !!o,
		disabled: l,
		name: u,
		children: [
			/* @__PURE__ */ n(r.Label, {
				className: h.label,
				children: [e, c ? /* @__PURE__ */ t("span", {
					className: h.required,
					children: " required"
				}) : null]
			}),
			/* @__PURE__ */ n("div", {
				className: h.control,
				children: [/* @__PURE__ */ t(i, {
					className: h.input,
					required: c,
					...p
				}), s ? /* @__PURE__ */ t("span", {
					className: h.suffix,
					children: s
				}) : null]
			}),
			o ? /* @__PURE__ */ t(r.Error, {
				className: h.error,
				match: !0,
				children: o
			}) : a ? /* @__PURE__ */ t(r.Description, {
				className: h.help,
				children: a
			}) : null
		]
	});
}
// src/icons/index.tsx
var _ = {
	viewBox: "0 0 16 16",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.75,
	strokeLinecap: "round",
	strokeLinejoin: "round",
	"aria-hidden": !0,
	focusable: !1
}, v = (e) => /* @__PURE__ */ t("svg", {
	..._,
	...e,
	children: /* @__PURE__ */ t("path", { d: "M3.5 8.5l3 3 6-7" })
}), y = (e) => /* @__PURE__ */ t("svg", {
	..._,
	...e,
	children: /* @__PURE__ */ t("path", { d: "M4 6l4 4 4-4" })
}), b = (e) => /* @__PURE__ */ t("svg", {
	..._,
	...e,
	children: /* @__PURE__ */ t("path", { d: "M4 4l8 8M12 4l-8 8" })
}), x = (e) => /* @__PURE__ */ n("svg", {
	..._,
	...e,
	children: [/* @__PURE__ */ t("circle", {
		cx: "8",
		cy: "8",
		r: "6.25"
	}), /* @__PURE__ */ t("path", { d: "M8 7.25v4M8 5v.25" })]
}), S = (e) => /* @__PURE__ */ n("svg", {
	..._,
	...e,
	children: [/* @__PURE__ */ t("path", { d: "M8 2.5l6 11H2z" }), /* @__PURE__ */ t("path", { d: "M8 7v3M8 12v.25" })]
}), C = (e) => /* @__PURE__ */ n("svg", {
	..._,
	...e,
	children: [/* @__PURE__ */ t("circle", {
		cx: "8",
		cy: "8",
		r: "6.25"
	}), /* @__PURE__ */ t("path", { d: "M5.25 8.25l1.75 1.75 3.75-4" })]
}), w = (e) => /* @__PURE__ */ n("svg", {
	..._,
	...e,
	children: [/* @__PURE__ */ t("circle", {
		cx: "8",
		cy: "8",
		r: "6.25"
	}), /* @__PURE__ */ t("path", { d: "M5.75 5.75l4.5 4.5M10.25 5.75l-4.5 4.5" })]
}), T = {
	root: "gds-checkbox",
	box: "gds-checkbox__box",
	indicator: "gds-checkbox__indicator",
	text: "gds-checkbox__text"
};
// src/components/Checkbox/Checkbox.tsx
function E({ children: e, className: r, ...i }) {
	return /* @__PURE__ */ n("label", {
		className: f(T.root, r),
		children: [/* @__PURE__ */ t(a.Root, {
			className: T.box,
			...i,
			children: /* @__PURE__ */ t(a.Indicator, {
				className: T.indicator,
				children: /* @__PURE__ */ t(v, {})
			})
		}), /* @__PURE__ */ t("span", {
			className: T.text,
			children: e
		})]
	});
}
var D = {
	root: "gds-radio-group",
	legend: "gds-radio-group__legend",
	item: "gds-radio-group__item",
	control: "gds-radio-group__control",
	indicator: "gds-radio-group__indicator",
	text: "gds-radio-group__text"
};
// src/components/RadioGroup/RadioGroup.tsx
function O({ label: e, className: r, children: i, ...a }) {
	return /* @__PURE__ */ n(s, {
		className: f(D.root, r),
		"aria-label": typeof e == "string" ? e : void 0,
		...a,
		children: [/* @__PURE__ */ t("span", {
			className: D.legend,
			children: e
		}), i]
	});
}
function k({ children: e, className: r, ...i }) {
	return /* @__PURE__ */ n("label", {
		className: f(D.item, r),
		children: [/* @__PURE__ */ t(o.Root, {
			className: D.control,
			...i,
			children: /* @__PURE__ */ t(o.Indicator, { className: D.indicator })
		}), /* @__PURE__ */ t("span", {
			className: D.text,
			children: e
		})]
	});
}
var A = {
	root: "gds-switch",
	track: "gds-switch__track",
	thumb: "gds-switch__thumb",
	text: "gds-switch__text"
};
// src/components/Switch/Switch.tsx
function j({ children: e, className: r, ...i }) {
	return /* @__PURE__ */ n("label", {
		className: f(A.root, r),
		children: [/* @__PURE__ */ t(c.Root, {
			className: A.track,
			...i,
			children: /* @__PURE__ */ t(c.Thumb, { className: A.thumb })
		}), /* @__PURE__ */ t("span", {
			className: A.text,
			children: e
		})]
	});
}
var M = {
	root: "gds-tabs",
	list: "gds-tabs__list",
	tab: "gds-tabs__tab",
	count: "gds-tabs__count",
	indicator: "gds-tabs__indicator",
	panel: "gds-tabs__panel"
};
// src/components/Tabs/Tabs.tsx
function ee({ className: e, ...n }) {
	return /* @__PURE__ */ t(l.Root, {
		className: f(M.root, e),
		...n
	});
}
function te({ className: e, children: r, ...i }) {
	return /* @__PURE__ */ n(l.List, {
		className: f(M.list, e),
		...i,
		children: [r, /* @__PURE__ */ t(l.Indicator, { className: M.indicator })]
	});
}
function N({ className: e, count: r, children: i, ...a }) {
	return /* @__PURE__ */ n(l.Tab, {
		className: f(M.tab, e),
		...a,
		children: [i, r !== void 0 && /* @__PURE__ */ t("span", {
			className: M.count,
			children: r
		})]
	});
}
function P({ className: e, ...n }) {
	return /* @__PURE__ */ t(l.Panel, {
		className: f(M.panel, e),
		...n
	});
}
var F = {
	Root: ee,
	List: te,
	Tab: N,
	Panel: P
}, I = {
	root: "gds-card",
	header: "gds-card__header",
	eyebrow: "gds-card__eyebrow",
	title: "gds-card__title",
	actions: "gds-card__actions",
	body: "gds-card__body",
	footer: "gds-card__footer"
};
// src/components/Card/Card.tsx
function L({ eyebrow: e, title: r, actions: i, footer: a, elevated: o, className: s, children: c, ...l }) {
	let u = e || r || i;
	return /* @__PURE__ */ n("section", {
		className: f(I.root, s),
		"data-elevated": o || void 0,
		...l,
		children: [
			u && /* @__PURE__ */ n("header", {
				className: I.header,
				children: [/* @__PURE__ */ n("div", { children: [e && /* @__PURE__ */ t("p", {
					className: I.eyebrow,
					children: e
				}), r && /* @__PURE__ */ t("h3", {
					className: I.title,
					children: r
				})] }), i && /* @__PURE__ */ t("div", {
					className: I.actions,
					children: i
				})]
			}),
			/* @__PURE__ */ t("div", {
				className: I.body,
				children: c
			}),
			a && /* @__PURE__ */ t("footer", {
				className: I.footer,
				children: a
			})
		]
	});
}
var R = {
	root: "gds-badge",
	dot: "gds-badge__dot",
	label: "gds-badge__label"
};
// src/components/Badge/Badge.tsx
function z({ kind: e = "neutral", variant: r = "subtle", dot: i = !1, className: a, children: o, ...s }) {
	return /* @__PURE__ */ n("span", {
		className: f(R.root, a),
		"data-kind": e,
		"data-variant": r,
		...s,
		children: [i && /* @__PURE__ */ t("span", {
			className: R.dot,
			"aria-hidden": !0
		}), /* @__PURE__ */ t("span", {
			className: R.label,
			children: o
		})]
	});
}
var B = {
	root: "gds-alert",
	icon: "gds-alert__icon",
	body: "gds-alert__body",
	title: "gds-alert__title",
	text: "gds-alert__text",
	action: "gds-alert__action"
}, V = {
	info: x,
	good: C,
	warning: S,
	critical: w
};
function H({ kind: e = "info", title: r, action: i, className: a, children: o, ...s }) {
	let c = V[e];
	return /* @__PURE__ */ n("div", {
		className: f(B.root, a),
		"data-kind": e,
		role: e === "critical" ? "alert" : "status",
		...s,
		children: [
			/* @__PURE__ */ t("span", {
				className: B.icon,
				children: /* @__PURE__ */ t(c, {})
			}),
			/* @__PURE__ */ n("div", {
				className: B.body,
				children: [/* @__PURE__ */ t("p", {
					className: B.title,
					children: r
				}), o && /* @__PURE__ */ t("div", {
					className: B.text,
					children: o
				})]
			}),
			i && /* @__PURE__ */ t("div", {
				className: B.action,
				children: i
			})
		]
	});
}
var U = {
	backdrop: "gds-dialog__backdrop",
	root: "gds-dialog",
	header: "gds-dialog__header",
	title: "gds-dialog__title",
	close: "gds-dialog__close",
	description: "gds-dialog__description",
	body: "gds-dialog__body",
	footer: "gds-dialog__footer"
};
// src/components/Dialog/Dialog.tsx
function W({ className: e, title: r, description: i, footer: a, hideClose: o, children: s, ...c }) {
	return /* @__PURE__ */ n(u.Portal, { children: [/* @__PURE__ */ t(u.Backdrop, { className: U.backdrop }), /* @__PURE__ */ n(u.Popup, {
		className: f(U.root, e),
		...c,
		children: [
			/* @__PURE__ */ n("header", {
				className: U.header,
				children: [/* @__PURE__ */ t(u.Title, {
					className: U.title,
					children: r
				}), !o && /* @__PURE__ */ t(u.Close, {
					className: U.close,
					"aria-label": "Close",
					children: /* @__PURE__ */ t(b, {})
				})]
			}),
			i && /* @__PURE__ */ t(u.Description, {
				className: U.description,
				children: i
			}),
			s && /* @__PURE__ */ t("div", {
				className: U.body,
				children: s
			}),
			a && /* @__PURE__ */ t("footer", {
				className: U.footer,
				children: a
			})
		]
	})] });
}
var G = {
	Root: u.Root,
	Trigger: u.Trigger,
	Close: u.Close,
	Popup: W
}, K = {
	scroll: "gds-table__scroll",
	root: "gds-table",
	head: "gds-table__head",
	headerCell: "gds-table__header-cell",
	row: "gds-table__row",
	body: "gds-table__body",
	cell: "gds-table__cell",
	empty: "gds-table__empty"
};
// src/components/Table/Table.tsx
function q({ className: e, striped: n, ...r }) {
	return /* @__PURE__ */ t("div", {
		className: K.scroll,
		children: /* @__PURE__ */ t("table", {
			className: f(K.root, e),
			"data-striped": n || void 0,
			...r
		})
	});
}
var J = {
	Root: q,
	Head: ({ className: e, ...n }) => /* @__PURE__ */ t("thead", {
		className: f(K.head, e),
		...n
	}),
	Body: ({ className: e, ...n }) => /* @__PURE__ */ t("tbody", {
		className: f(K.body, e),
		...n
	}),
	Row: ({ className: e, selected: n, ...r }) => /* @__PURE__ */ t("tr", {
		className: f(K.row, e),
		"data-selected": n || void 0,
		"aria-selected": n,
		...r
	}),
	HeaderCell: ({ className: e, numeric: n, ...r }) => /* @__PURE__ */ t("th", {
		scope: "col",
		className: f(K.headerCell, e),
		"data-numeric": n || void 0,
		...r
	}),
	Cell: ({ className: e, numeric: n, ...r }) => /* @__PURE__ */ t("td", {
		className: f(K.cell, e),
		"data-numeric": n || void 0,
		...r
	}),
	Empty: ({ className: e, colSpan: n, ...r }) => /* @__PURE__ */ t("tr", {
		className: K.row,
		children: /* @__PURE__ */ t("td", {
			className: f(K.empty, e),
			colSpan: n,
			...r
		})
	})
}, Y = {
	positioner: "gds-tooltip__positioner",
	root: "gds-tooltip"
};
// src/components/Tooltip/Tooltip.tsx
function X({ content: e, children: r, side: i = "top", className: a, ...o }) {
	return /* @__PURE__ */ n(d.Root, {
		...o,
		children: [/* @__PURE__ */ t(d.Trigger, { render: r }), /* @__PURE__ */ t(d.Portal, { children: /* @__PURE__ */ t(d.Positioner, {
			side: i,
			sideOffset: 6,
			className: Y.positioner,
			children: /* @__PURE__ */ t(d.Popup, {
				className: f(Y.root, a),
				children: e
			})
		}) })]
	});
}
var Z = d.Provider, Q = {
	root: "gds-key-figure",
	label: "gds-key-figure__label",
	value: "gds-key-figure__value",
	unit: "gds-key-figure__unit",
	delta: "gds-key-figure__delta",
	provenance: "gds-key-figure__provenance"
};
// src/components/KeyFigure/KeyFigure.tsx
function ne({ label: e, value: r, unit: i, delta: a, deltaTone: o = "neutral", provenance: s, className: c, ...l }) {
	return /* @__PURE__ */ n("div", {
		className: f(Q.root, c),
		...l,
		children: [
			/* @__PURE__ */ t("p", {
				className: Q.label,
				children: e
			}),
			/* @__PURE__ */ n("p", {
				className: Q.value,
				children: [r, i && /* @__PURE__ */ n("span", {
					className: Q.unit,
					children: [" ", i]
				})]
			}),
			a && /* @__PURE__ */ t("p", {
				className: Q.delta,
				"data-tone": o,
				children: a
			}),
			s && /* @__PURE__ */ t("p", {
				className: Q.provenance,
				children: s
			})
		]
	});
}
var $ = {
	root: "gds-app-shell",
	topBar: "gds-app-shell__top-bar",
	brand: "gds-app-shell__brand",
	switcher: "gds-app-shell__switcher",
	spacer: "gds-app-shell__spacer",
	actions: "gds-app-shell__actions",
	sideNav: "gds-app-shell__side-nav",
	navGroup: "gds-app-shell__nav-group",
	navItem: "gds-app-shell__nav-item",
	navIcon: "gds-app-shell__nav-icon",
	navLabel: "gds-app-shell__nav-label",
	navStep: "gds-app-shell__nav-step",
	main: "gds-app-shell__main",
	breadcrumb: "gds-app-shell__breadcrumb",
	breadcrumbList: "gds-app-shell__breadcrumb-list",
	breadcrumbItem: "gds-app-shell__breadcrumb-item",
	pageHeader: "gds-app-shell__page-header",
	pageTitle: "gds-app-shell__page-title",
	pageSubtitle: "gds-app-shell__page-subtitle",
	pageActions: "gds-app-shell__page-actions",
	empty: "gds-app-shell__empty",
	emptyTitle: "gds-app-shell__empty-title",
	emptyText: "gds-app-shell__empty-text"
}, re = {
	Root: ({ className: e, ...n }) => /* @__PURE__ */ t("div", {
		className: f($.root, e),
		...n
	}),
	TopBar: ({ className: e, brand: r, switcher: i, actions: a, ...o }) => /* @__PURE__ */ n("header", {
		className: f($.topBar, e),
		...o,
		children: [
			/* @__PURE__ */ t("div", {
				className: $.brand,
				children: r
			}),
			i && /* @__PURE__ */ t("div", {
				className: $.switcher,
				children: i
			}),
			/* @__PURE__ */ t("div", { className: $.spacer }),
			a && /* @__PURE__ */ t("div", {
				className: $.actions,
				children: a
			})
		]
	}),
	SideNav: ({ className: e, ...n }) => /* @__PURE__ */ t("nav", {
		className: f($.sideNav, e),
		"aria-label": "Main",
		...n
	}),
	NavGroup: ({ className: e, ...n }) => /* @__PURE__ */ t("p", {
		className: f($.navGroup, e),
		...n
	}),
	NavItem: ({ className: e, icon: r, current: i, step: a, children: o, ...s }) => /* @__PURE__ */ n("a", {
		className: f($.navItem, e),
		"data-current": i || void 0,
		"aria-current": i ? "page" : void 0,
		...s,
		children: [
			r && /* @__PURE__ */ t("span", {
				className: $.navIcon,
				children: r
			}),
			/* @__PURE__ */ t("span", {
				className: $.navLabel,
				children: o
			}),
			a && /* @__PURE__ */ t("span", {
				className: $.navStep,
				children: a
			})
		]
	}),
	Main: ({ className: e, ...n }) => /* @__PURE__ */ t("main", {
		className: f($.main, e),
		...n
	}),
	Breadcrumb: ({ className: e, items: n, ...r }) => /* @__PURE__ */ t("nav", {
		className: f($.breadcrumb, e),
		"aria-label": "Breadcrumb",
		...r,
		children: /* @__PURE__ */ t("ol", {
			className: $.breadcrumbList,
			children: n.map((e, r) => /* @__PURE__ */ t("li", {
				className: $.breadcrumbItem,
				"aria-current": r === n.length - 1 ? "page" : void 0,
				children: e
			}, r))
		})
	}),
	PageHeader: ({ className: e, title: r, subtitle: i, actions: a, ...o }) => /* @__PURE__ */ n("div", {
		className: f($.pageHeader, e),
		...o,
		children: [/* @__PURE__ */ n("div", { children: [/* @__PURE__ */ t("h1", {
			className: $.pageTitle,
			children: r
		}), i && /* @__PURE__ */ t("p", {
			className: $.pageSubtitle,
			children: i
		})] }), a && /* @__PURE__ */ t("div", {
			className: $.pageActions,
			children: a
		})]
	}),
	Empty: ({ className: e, title: r, children: i, ...a }) => /* @__PURE__ */ n("div", {
		className: f($.empty, e),
		...a,
		children: [/* @__PURE__ */ t("p", {
			className: $.emptyTitle,
			children: r
		}), i && /* @__PURE__ */ t("div", {
			className: $.emptyText,
			children: i
		})]
	})
};
export { H as Alert, re as AppShell, z as Badge, m as Button, L as Card, v as CheckIcon, E as Checkbox, y as ChevronDownIcon, b as CloseIcon, w as CriticalIcon, G as Dialog, C as GoodIcon, x as InfoIcon, ne as KeyFigure, k as Radio, O as RadioGroup, j as Switch, J as Table, F as Tabs, g as TextField, X as Tooltip, Z as TooltipProvider, S as WarningIcon };

//# sourceMappingURL=index.js.map