//! Create boilerplate for a new plugin (collection of checks).

use std::fs;
use std::io::Write;
use std::path::PathBuf;

use anyhow::{Context, Result};
use clap::Args;
use regex::{Captures, Regex};

use crate::helpers::update_file;

#[derive(Args)]
pub struct Cli {
    /// Name of the plugin
    #[arg(required = true)]
    name: String,
}

pub fn main(cli: &Cli) -> Result<()> {
    let name = &cli.name;
    let ident = cli.name.to_lowercase().replace('-', "_");

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let root_dir = manifest_dir.parent().context("Finding root directory")?;

    let plugin_dir = root_dir.join("src").join(&ident);
    fs::create_dir(&plugin_dir).context("Creating plugin directory")?;

    let mut file = fs::File::create(plugin_dir.join("mod.rs")).context("Creating mod.rs")?;
    write!(file, "pub mod plugins;\n")?;
    fs::File::create(plugin_dir.join("plugins.rs")).context("Creating plugins.rs")?;

    let test_dir_path = root_dir
        .join("resources")
        .join("test")
        .join("fixtures")
        .join(&ident);
    fs::create_dir(&test_dir_path).context("Creating test fixture directory")?;
    let mut file =
        fs::File::create(test_dir_path.join("TODO.py")).context("Creating example test file")?;
    write!(file, "x = 3\n")?;

    let lib_rs_path = root_dir.join("src").join("lib.rs");
    update_file(lib_rs_path, |s| {
        let needle = "mod flake8_print;";
        s.replace(needle, &format!("mod {ident};\n{needle}"))
    })
    .context("Updating src/lib.rs")?;

    let checks_rs_path = root_dir.join("src").join("checks.rs");
    update_file(checks_rs_path, |s| {
        let mut new = {
            let re = Regex::new(r"(?m)^(?P<indent>\s+)(?P<needle>// flake8-print)$").unwrap();
            re.replace_all(&s, |caps: &Captures| {
                textwrap::indent(
                    &format!("// {name}\n{}", caps.name("needle").unwrap().as_str()),
                    caps.name("indent").unwrap().as_str(),
                )
            })
            .to_string()
        };

        new = {
            let re = Regex::new(r"(?m)^(?P<indent>\s+)(?P<needle>Flake8Print,)$").unwrap();
            re.replace(&new, |caps: &Captures| {
                textwrap::indent(
                    &format!(
                        "// TODO: Adjust name and complete impl of CheckCategory\n{ident},\n{}",
                        caps.name("needle").unwrap().as_str()
                    ),
                    caps.name("indent").unwrap().as_str(),
                )
            })
            .to_string()
        };

        new
    })
    .context("Updating src/checks.rs")?;

    let license_path = root_dir.join("LICENSE");
    update_file(license_path, |s| {
        let needle = "- flake8-print, licensed as follows:";
        s.replace(
            needle,
            &format!("- {name}, licensed as follows:\n  \"\"\"\n    TODO\n  \"\"\"\n\n{needle}"),
        )
    })
    .context("Updating LICENSE")?;

    Ok(())
}
