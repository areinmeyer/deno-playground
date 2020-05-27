import { serve } from "https://deno.land/std@0.50.0/http/server.ts";

function stripLeadingSlash(url: string): string {
  return url.startsWith("/") ? url.slice(1) : url;
}

function router(url: string): string {
	switch (url) {
		case "hello":
			return "Hello World!";
		case "":
			return `Hi! Try adding paths to the url to see different messages!\n`;

		default:
			return "Sorry, I can't help you!";
	}
}

const server = serve({ port: 9000 });

for await (const req of server) {
  let { url } = req;
  url = stripLeadingSlash(url);
  const body = router(url);
    req.respond({ body });
}
