---
name: Group
description: Explains the concept of groups in Audako and how they relate to tenants, entities, and applications.
---

In the configuration of an Audako tenant, a group is used to logically organize entities in a tree structure like directories. A tenant has a single root group, and groups can have multiple child groups, allowing for a hierarchical organization of entities. Each entity belongs to exactly one group, and groups can be used to manage access control and permissions for the entities they contain.

A group can be an EntryPoint which specifies whether users are allowed to create dashboards directly under that group.